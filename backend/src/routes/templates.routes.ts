import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const saveSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  domains: z.array(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional().default(''),
      weight: z.number().min(0).default(1.0),
      sortOrder: z.number().int().min(0).default(0),
      controls: z.array(
        z.object({
          controlId: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional().default(''),
          weight: z.number().min(0).default(1.0),
          sortOrder: z.number().int().min(0).default(0),
        })
      ).default([]),
    })
  ).default([]),
});

// GET /api/admin/templates — list all templates
router.get('/', authenticate, authorize('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { domains: true } },
      },
    });

    // Also get control counts per template
    const templatesWithCounts = await Promise.all(
      templates.map(async (t) => {
        const controlCount = await prisma.templateControl.count({
          where: { templateDomain: { templateId: t.id } },
        });
        return { ...t, _count: { ...t._count, controls: controlCount } };
      })
    );

    res.json(templatesWithCounts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/admin/templates/:id — get template with full tree
router.get('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        domains: {
          orderBy: { sortOrder: 'asc' },
          include: {
            controls: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(template);
  } catch {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/admin/templates — create empty template
router.post('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const template = await prisma.checklistTemplate.create({
      data: {
        name: data.name,
        description: data.description || '',
      },
    });
    res.status(201).json(template);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/admin/templates/:id — save full template tree (delete-and-recreate)
router.put('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = saveSchema.parse(req.body);
    const templateId = req.params.id;

    const existing = await prisma.checklistTemplate.findUnique({ where: { id: templateId } });
    if (!existing) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing domains (cascades to controls)
      await tx.templateDomain.deleteMany({ where: { templateId } });

      // Update template metadata
      await tx.checklistTemplate.update({
        where: { id: templateId },
        data: {
          name: data.name,
          description: data.description || '',
        },
      });

      // Create domains and controls
      for (const domain of data.domains) {
        const createdDomain = await tx.templateDomain.create({
          data: {
            templateId,
            code: domain.code,
            name: domain.name,
            description: domain.description || '',
            weight: domain.weight,
            sortOrder: domain.sortOrder,
          },
        });

        if (domain.controls.length > 0) {
          await tx.templateControl.createMany({
            data: domain.controls.map((c) => ({
              templateDomainId: createdDomain.id,
              controlId: c.controlId,
              name: c.name,
              description: c.description || '',
              weight: c.weight,
              sortOrder: c.sortOrder,
            })),
          });
        }
      }

      // Return updated template with full tree
      return tx.checklistTemplate.findUnique({
        where: { id: templateId },
        include: {
          domains: {
            orderBy: { sortOrder: 'asc' },
            include: {
              controls: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });
    });

    res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    console.error('Failed to save template:', e);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// DELETE /api/admin/templates/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    // Check if assessments reference this template — if so, just set null (onDelete: SetNull handles it)
    await prisma.checklistTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// POST /api/admin/templates/:id/duplicate — deep copy template
router.post('/:id/duplicate', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const source = await prisma.checklistTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        domains: {
          include: { controls: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!source) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const copy = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.checklistTemplate.create({
        data: {
          name: `${source.name} (Copy)`,
          description: source.description,
        },
      });

      for (const domain of source.domains) {
        const newDomain = await tx.templateDomain.create({
          data: {
            templateId: newTemplate.id,
            code: domain.code,
            name: domain.name,
            description: domain.description,
            weight: domain.weight,
            sortOrder: domain.sortOrder,
          },
        });

        if (domain.controls.length > 0) {
          await tx.templateControl.createMany({
            data: domain.controls.map((c) => ({
              templateDomainId: newDomain.id,
              controlId: c.controlId,
              name: c.name,
              description: c.description,
              weight: c.weight,
              sortOrder: c.sortOrder,
            })),
          });
        }
      }

      return tx.checklistTemplate.findUnique({
        where: { id: newTemplate.id },
        include: { _count: { select: { domains: true } } },
      });
    });

    res.status(201).json(copy);
  } catch {
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

// POST /api/admin/templates/:id/prefill-defaults — populate from global domains/controls
router.post('/:id/prefill-defaults', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const templateId = req.params.id;

    const existing = await prisma.checklistTemplate.findUnique({ where: { id: templateId } });
    if (!existing) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const globalDomains = await prisma.domain.findMany({
      include: { controls: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Clear existing domains
      await tx.templateDomain.deleteMany({ where: { templateId } });

      // Create domains/controls from global tables
      for (const gd of globalDomains) {
        const newDomain = await tx.templateDomain.create({
          data: {
            templateId,
            code: gd.code,
            name: gd.name,
            description: gd.description,
            weight: gd.weight,
            sortOrder: gd.sortOrder,
          },
        });

        if (gd.controls.length > 0) {
          await tx.templateControl.createMany({
            data: gd.controls.map((c) => ({
              templateDomainId: newDomain.id,
              controlId: c.controlId,
              name: c.name,
              description: c.description,
              weight: c.weight,
              sortOrder: c.sortOrder,
            })),
          });
        }
      }

      return tx.checklistTemplate.findUnique({
        where: { id: templateId },
        include: {
          domains: {
            orderBy: { sortOrder: 'asc' },
            include: {
              controls: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to prefill template defaults' });
  }
});

export default router;
