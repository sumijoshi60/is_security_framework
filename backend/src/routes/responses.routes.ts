import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest, MATURITY_LEVELS } from '../types';

const router = Router();
const prisma = new PrismaClient();

const maturityLevelValidator = z.string().refine((v) => (MATURITY_LEVELS as readonly string[]).includes(v), {
  message: 'Invalid maturity level',
});

const targetMaturityValidator = z.string().refine(
  (v) => (MATURITY_LEVELS as readonly string[]).includes(v),
  { message: 'Invalid target maturity level' }
).nullable().optional();

const updateResponseSchema = z.object({
  maturityLevel: maturityLevelValidator,
  targetMaturityLevel: targetMaturityValidator,
  notes: z.string().optional(),
});

const batchUpdateSchema = z.object({
  responses: z.array(
    z.object({
      controlId: z.string(),
      maturityLevel: maturityLevelValidator,
      targetMaturityLevel: targetMaturityValidator,
      notes: z.string().optional(),
    })
  ),
});

// PUT /api/assessments/:assessmentId/responses/:controlId
router.put(
  '/:assessmentId/responses/:controlId',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId, controlId } = req.params;
      const { maturityLevel, targetMaturityLevel, notes } = updateResponseSchema.parse(req.body);

      // Verify assessment exists and is editable
      const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }
      if (assessment.status !== 'DRAFT') {
        res.status(400).json({ error: 'Can only edit DRAFT assessments' });
        return;
      }

      const response = await prisma.response.upsert({
        where: { assessmentId_controlId: { assessmentId, controlId } },
        update: {
          maturityLevel,
          targetMaturityLevel: targetMaturityLevel !== undefined ? targetMaturityLevel : undefined,
          notes: notes ?? undefined,
        },
        create: {
          assessmentId,
          controlId,
          maturityLevel,
          targetMaturityLevel: targetMaturityLevel ?? null,
          notes: notes ?? '',
        },
      });

      await prisma.auditLog.create({
        data: {
          assessmentId,
          userId: req.user!.userId,
          action: 'RESPONSE_UPDATE',
          details: { controlId, maturityLevel, targetMaturityLevel, notes },
        },
      });

      res.json(response);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: e.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update response' });
    }
  }
);

// PUT /api/assessments/:assessmentId/responses — batch update
router.put(
  '/:assessmentId/responses',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId } = req.params;
      const { responses } = batchUpdateSchema.parse(req.body);

      const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }
      if (assessment.status !== 'DRAFT') {
        res.status(400).json({ error: 'Can only edit DRAFT assessments' });
        return;
      }

      const results = [];
      for (const r of responses) {
        const result = await prisma.response.upsert({
          where: { assessmentId_controlId: { assessmentId, controlId: r.controlId } },
          update: {
            maturityLevel: r.maturityLevel,
            targetMaturityLevel: r.targetMaturityLevel !== undefined ? r.targetMaturityLevel : undefined,
            notes: r.notes ?? undefined,
          },
          create: {
            assessmentId,
            controlId: r.controlId,
            maturityLevel: r.maturityLevel,
            targetMaturityLevel: r.targetMaturityLevel ?? null,
            notes: r.notes ?? '',
          },
        });
        results.push(result);
      }

      res.json(results);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: e.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to batch update responses' });
    }
  }
);

export default router;
