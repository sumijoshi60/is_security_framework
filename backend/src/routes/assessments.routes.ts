import { Router, Response } from 'express';
import { PrismaClient, AssessmentStatus } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';
import { importExcelAssessment, exportAssessmentToExcel } from '../services/excel-import.service';
import { calculateAssessmentScoring } from '../services/scoring.service';
import { generateReport } from '../services/report.service';

const router = Router();
const prisma = new PrismaClient();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are accepted'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const createSchema = z.object({
  templateId: z.string().uuid(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'DRAFT'],
  APPROVED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: [],
};

// GET /api/assessments
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user!.role === 'VIEWER'
      ? { status: 'APPROVED' as AssessmentStatus }
      : req.user!.role === 'AUDITOR'
        ? { createdBy: req.user!.userId }
        : {};

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        template: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    });
    res.json(assessments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// GET /api/assessments/templates — lightweight list for template picker
router.get('/templates', authenticate, authorize('ADMIN', 'AUDITOR'), async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/assessments/:id/gaps — gap analysis (must be before /:id to avoid conflict)
router.get('/:id/gaps', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const responses = await prisma.response.findMany({
      where: { assessmentId: req.params.id },
      include: {
        control: { include: { domain: true } },
        _count: { select: { evidence: true, actionItems: true } },
      },
    });

    // Import scoring config
    const scoringConfig = await import('../types');
    const MATURITY_SCORES = scoringConfig.MATURITY_SCORES;
    const EXCLUDE = scoringConfig.EXCLUDE_FROM_SCORING;

    // Fetch assessment weights
    const controlWeights = await prisma.assessmentControlWeight.findMany({
      where: { assessmentId: req.params.id },
    });
    const weightMap = new Map(controlWeights.map((w) => [w.controlId, w.weight]));

    const gaps = [];

    for (const r of responses) {
      if (!r.targetMaturityLevel || EXCLUDE.includes(r.maturityLevel) || EXCLUDE.includes(r.targetMaturityLevel)) continue;

      const currentScore = MATURITY_SCORES[r.maturityLevel] ?? 0;
      const targetScore = MATURITY_SCORES[r.targetMaturityLevel] ?? 0;
      const gap = targetScore - currentScore;

      if (gap <= 0) continue;

      const weight = weightMap.get(r.controlId) ?? r.control.weight;

      gaps.push({
        controlId: r.controlId,
        controlCode: r.control.controlId,
        controlName: r.control.name,
        domainCode: r.control.domain.code,
        currentLevel: r.maturityLevel,
        targetLevel: r.targetMaturityLevel,
        currentScore,
        targetScore,
        gap,
        weight,
        priorityScore: Math.round(gap * weight * 100) / 100,
        evidenceCount: r._count.evidence,
        actionItemCount: r._count.actionItems,
      });
    }

    gaps.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({
      totalGaps: gaps.length,
      criticalGaps: gaps.filter((g) => g.gap >= 2).length,
      gaps,
    });
  } catch {
    res.status(500).json({ error: 'Failed to compute gap analysis' });
  }
});

// GET /api/assessments/:id/report — AI-generated report
router.get('/:id/report', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const report = await generateReport(req.params.id);
    res.json(report);
  } catch (e) {
    console.error('Report generation failed:', e);
    const message = e instanceof Error ? e.message : 'Report generation failed';
    res.status(500).json({ error: message });
  }
});

// POST /api/assessments — create assessment from template
router.post('/', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = createSchema.parse(req.body);

    // Fetch template with full tree
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        domains: {
          include: { controls: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Upsert template domains/controls into global tables (needed for Response FKs)
    for (const td of template.domains) {
      await prisma.domain.upsert({
        where: { code: td.code },
        update: { name: td.name, description: td.description },
        create: {
          code: td.code,
          name: td.name,
          description: td.description,
          weight: td.weight,
          sortOrder: td.sortOrder,
        },
      });
    }

    // Re-fetch domains to get their IDs
    const globalDomains = await prisma.domain.findMany();
    const domainCodeToId = new Map(globalDomains.map((d) => [d.code, d.id]));

    for (const td of template.domains) {
      const globalDomainId = domainCodeToId.get(td.code)!;
      for (const tc of td.controls) {
        await prisma.control.upsert({
          where: { controlId: tc.controlId },
          update: { name: tc.name, description: tc.description, domainId: globalDomainId },
          create: {
            controlId: tc.controlId,
            name: tc.name,
            description: tc.description,
            weight: tc.weight,
            domainId: globalDomainId,
            sortOrder: tc.sortOrder,
          },
        });
      }
    }

    // Re-fetch controls to get their IDs
    const allControlIds = template.domains.flatMap((td) => td.controls.map((tc) => tc.controlId));
    const globalControls = await prisma.control.findMany({
      where: { controlId: { in: allControlIds } },
    });
    const controlIdMap = new Map(globalControls.map((c) => [c.controlId, c.id]));

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        title: template.name,
        templateId: template.id,
        createdBy: req.user!.userId,
      },
    });

    // Create responses for each template control
    const responseData = template.domains.flatMap((td) =>
      td.controls.map((tc) => ({
        assessmentId: assessment.id,
        controlId: controlIdMap.get(tc.controlId)!,
        maturityLevel: '? Unknown',
        notes: '',
      }))
    );

    await prisma.response.createMany({ data: responseData });

    // Snapshot template weights into assessment weight tables
    const domainWeightData = template.domains.map((td) => ({
      assessmentId: assessment.id,
      domainId: domainCodeToId.get(td.code)!,
      weight: td.weight,
    }));
    await prisma.assessmentDomainWeight.createMany({ data: domainWeightData });

    const controlWeightData = template.domains.flatMap((td) =>
      td.controls.map((tc) => ({
        assessmentId: assessment.id,
        controlId: controlIdMap.get(tc.controlId)!,
        weight: tc.weight,
      }))
    );
    await prisma.assessmentControlWeight.createMany({ data: controlWeightData });

    res.status(201).json(assessment);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    console.error('Failed to create assessment:', e);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// GET /api/assessments/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        template: { select: { id: true, name: true } },
        responses: {
          include: {
            control: { include: { domain: true } },
          },
          orderBy: { control: { sortOrder: 'asc' } },
        },
      },
    });
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    // Enforce viewer access
    if (req.user!.role === 'VIEWER' && assessment.status !== 'APPROVED') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(assessment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// PATCH /api/assessments/:id/status — transition status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(AssessmentStatus) }).parse(req.body);

    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    // Only admins can approve
    if (status === 'APPROVED' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can approve assessments' });
      return;
    }

    const allowed = VALID_TRANSITIONS[assessment.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Cannot transition from ${assessment.status} to ${status}` });
      return;
    }

    const updated = await prisma.assessment.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        assessmentId: assessment.id,
        userId: req.user!.userId,
        action: 'STATUS_CHANGE',
        details: { from: assessment.status, to: status },
      },
    });

    res.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/assessments/import — import from Excel
router.post('/import', authenticate, authorize('ADMIN', 'AUDITOR'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const title = (req.body.title as string) || `Excel Import - ${new Date().toISOString()}`;
    const result = await importExcelAssessment(req.file.path, title, req.user!.userId);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: 'Import failed', details: String(e) });
  }
});

// GET /api/assessments/:id/scoring
router.get('/:id/scoring', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const scoring = await calculateAssessmentScoring(req.params.id);
    res.json(scoring);
  } catch {
    res.status(500).json({ error: 'Failed to calculate scoring' });
  }
});

// GET /api/assessments/:id/export
router.get('/:id/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workbook = await exportAssessmentToExcel(req.params.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=assessment-${req.params.id}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ error: 'Export failed' });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.assessment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

export default router;
