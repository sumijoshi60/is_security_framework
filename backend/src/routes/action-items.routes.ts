import { Router, Response } from 'express';
import { PrismaClient, ActionPriority, ActionStatus } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  status: z.nativeEnum(ActionStatus).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// GET /api/assessments/:assessmentId/responses/:controlId/actions
router.get(
  '/:assessmentId/responses/:controlId/actions',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId, controlId } = req.params;

      const response = await prisma.response.findUnique({
        where: { assessmentId_controlId: { assessmentId, controlId } },
      });

      if (!response) {
        res.json([]);
        return;
      }

      const actions = await prisma.actionItem.findMany({
        where: { responseId: response.id },
        include: {
          assignee: { select: { name: true, email: true } },
          creator: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(actions);
    } catch {
      res.status(500).json({ error: 'Failed to fetch action items' });
    }
  }
);

// GET /api/assessments/:assessmentId/actions — all action items for assessment
router.get(
  '/:assessmentId/actions',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId } = req.params;
      const { status, priority, assignedTo } = req.query;

      const where: any = {
        response: { assessmentId },
      };

      if (status) where.status = status as string;
      if (priority) where.priority = priority as string;
      if (assignedTo) where.assignedTo = assignedTo as string;

      const actions = await prisma.actionItem.findMany({
        where,
        include: {
          assignee: { select: { name: true, email: true } },
          creator: { select: { name: true } },
          response: {
            select: {
              controlId: true,
              control: { select: { controlId: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(actions);
    } catch {
      res.status(500).json({ error: 'Failed to fetch action items' });
    }
  }
);

// POST /api/assessments/:assessmentId/responses/:controlId/actions
router.post(
  '/:assessmentId/responses/:controlId/actions',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId, controlId } = req.params;
      const data = createSchema.parse(req.body);

      const response = await prisma.response.findUnique({
        where: { assessmentId_controlId: { assessmentId, controlId } },
      });

      if (!response) {
        res.status(404).json({ error: 'Response not found for this control' });
        return;
      }

      const action = await prisma.actionItem.create({
        data: {
          responseId: response.id,
          title: data.title,
          description: data.description || '',
          priority: data.priority || 'MEDIUM',
          assignedTo: data.assignedTo ?? null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          createdBy: req.user!.userId,
        },
        include: {
          assignee: { select: { name: true, email: true } },
          creator: { select: { name: true } },
        },
      });

      res.status(201).json(action);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: e.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to create action item' });
    }
  }
);

// PUT /api/assessments/:assessmentId/actions/:actionId
router.put(
  '/:assessmentId/actions/:actionId',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateSchema.parse(req.body);

      const existing = await prisma.actionItem.findUnique({
        where: { id: req.params.actionId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Action item not found' });
        return;
      }

      const action = await prisma.actionItem.update({
        where: { id: req.params.actionId },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          assignedTo: data.assignedTo !== undefined ? data.assignedTo : undefined,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        },
        include: {
          assignee: { select: { name: true, email: true } },
          creator: { select: { name: true } },
        },
      });

      res.json(action);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: e.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update action item' });
    }
  }
);

// DELETE /api/assessments/:assessmentId/actions/:actionId
router.delete(
  '/:assessmentId/actions/:actionId',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.actionItem.delete({ where: { id: req.params.actionId } });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: 'Failed to delete action item' });
    }
  }
);

export default router;
