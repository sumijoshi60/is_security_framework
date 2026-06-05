import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// --- DOMAINS ---

// GET /api/admin/domains
router.get('/domains', async (_req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        controls: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { responses: true } },
          },
        },
      },
    });
    res.json(domains);
  } catch {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

const createDomainSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  weight: z.number().positive().optional().default(1.0),
  sortOrder: z.number().int().optional(),
});

// POST /api/admin/domains
router.post('/domains', async (req: AuthRequest, res: Response) => {
  try {
    const data = createDomainSchema.parse(req.body);

    const sortOrder = data.sortOrder ?? ((await prisma.domain.aggregate({ _max: { sortOrder: true } }))._max?.sortOrder ?? 0) + 1;

    const domain = await prisma.domain.create({ data: { ...data, sortOrder } });
    res.status(201).json(domain);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create domain' });
  }
});

const updateDomainSchema = z.object({
  code: z.string().min(1).max(10).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
});

// PUT /api/admin/domains/:id
router.put('/domains/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateDomainSchema.parse(req.body);
    const domain = await prisma.domain.update({
      where: { id: req.params.id },
      data,
    });
    res.json(domain);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update domain' });
  }
});

// DELETE /api/admin/domains/:id — cascade deletes controls/responses
router.delete('/domains/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.domain.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

// --- CONTROLS ---

// GET /api/admin/domains/:domainId/controls
router.get('/domains/:domainId/controls', async (req: AuthRequest, res: Response) => {
  try {
    const controls = await prisma.control.findMany({
      where: { domainId: req.params.domainId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(controls);
  } catch {
    res.status(500).json({ error: 'Failed to fetch controls' });
  }
});

const createControlSchema = z.object({
  controlId: z.string().min(1).optional(),
  name: z.string().min(1).max(500),
  description: z.string().optional().default(''),
  weight: z.number().positive().optional().default(1.0),
  sortOrder: z.number().int().optional(),
});

// POST /api/admin/domains/:domainId/controls
router.post('/domains/:domainId/controls', async (req: AuthRequest, res: Response) => {
  try {
    const data = createControlSchema.parse(req.body);
    const domainId = req.params.domainId;

    // Verify domain exists
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }

    const sortOrder = data.sortOrder ?? ((await prisma.control.aggregate({ where: { domainId }, _max: { sortOrder: true } }))._max?.sortOrder ?? 0) + 1;

    // Auto-generate controlId if not provided
    const controlIdValue = data.controlId || `${domain.code.replace('A', 'A.')}.${sortOrder}`;

    const control = await prisma.control.create({
      data: {
        controlId: controlIdValue,
        name: data.name,
        description: data.description,
        weight: data.weight,
        domainId,
        sortOrder,
      },
    });

    res.status(201).json(control);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create control' });
  }
});

const updateControlSchema = z.object({
  controlId: z.string().min(1).optional(),
  name: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
});

// PUT /api/admin/controls/:id
router.put('/controls/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateControlSchema.parse(req.body);
    const control = await prisma.control.update({
      where: { id: req.params.id },
      data,
    });
    res.json(control);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update control' });
  }
});

// DELETE /api/admin/controls/:id — cascade
router.delete('/controls/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.control.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete control' });
  }
});

export default router;
