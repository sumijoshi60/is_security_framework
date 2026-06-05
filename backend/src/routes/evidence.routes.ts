import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const EVIDENCE_DIR = process.env.UPLOAD_DIR ? path.join(process.env.UPLOAD_DIR, 'evidence') : './uploads/evidence';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const assessmentId = req.params.assessmentId as string;
      const dir = path.join(EVIDENCE_DIR, assessmentId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// GET /api/assessments/:assessmentId/responses/:controlId/evidence
router.get(
  '/:assessmentId/responses/:controlId/evidence',
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

      const evidence = await prisma.evidence.findMany({
        where: { responseId: response.id },
        include: { user: { select: { name: true } } },
        orderBy: { uploadedAt: 'desc' },
      });

      res.json(evidence);
    } catch {
      res.status(500).json({ error: 'Failed to fetch evidence' });
    }
  }
);

// POST /api/assessments/:assessmentId/responses/:controlId/evidence
router.post(
  '/:assessmentId/responses/:controlId/evidence',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId, controlId } = req.params;

      const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }
      if (assessment.status !== 'DRAFT') {
        res.status(400).json({ error: 'Can only add evidence to DRAFT assessments' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const response = await prisma.response.findUnique({
        where: { assessmentId_controlId: { assessmentId, controlId } },
      });

      if (!response) {
        res.status(404).json({ error: 'Response not found for this control' });
        return;
      }

      const evidence = await prisma.evidence.create({
        data: {
          responseId: response.id,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          description: (req.body.description as string) || '',
          uploadedBy: req.user!.userId,
        },
        include: { user: { select: { name: true } } },
      });

      res.status(201).json(evidence);
    } catch {
      res.status(500).json({ error: 'Failed to upload evidence' });
    }
  }
);

// GET /api/assessments/:assessmentId/evidence/:evidenceId/download
router.get(
  '/:assessmentId/evidence/:evidenceId/download',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const evidence = await prisma.evidence.findUnique({
        where: { id: req.params.evidenceId },
      });

      if (!evidence) {
        res.status(404).json({ error: 'Evidence not found' });
        return;
      }

      if (!fs.existsSync(evidence.filePath)) {
        res.status(404).json({ error: 'File not found on disk' });
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${evidence.fileName}"`);
      res.setHeader('Content-Type', evidence.mimeType);
      const stream = fs.createReadStream(evidence.filePath);
      stream.pipe(res);
    } catch {
      res.status(500).json({ error: 'Failed to download evidence' });
    }
  }
);

// DELETE /api/assessments/:assessmentId/evidence/:evidenceId
router.delete(
  '/:assessmentId/evidence/:evidenceId',
  authenticate,
  authorize('ADMIN', 'AUDITOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const assessment = await prisma.assessment.findUnique({ where: { id: req.params.assessmentId } });
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }
      if (assessment.status !== 'DRAFT') {
        res.status(400).json({ error: 'Can only delete evidence from DRAFT assessments' });
        return;
      }

      const evidence = await prisma.evidence.findUnique({
        where: { id: req.params.evidenceId },
      });

      if (!evidence) {
        res.status(404).json({ error: 'Evidence not found' });
        return;
      }

      // Delete file from disk
      if (fs.existsSync(evidence.filePath)) {
        fs.unlinkSync(evidence.filePath);
      }

      await prisma.evidence.delete({ where: { id: evidence.id } });

      res.status(204).send();
    } catch {
      res.status(500).json({ error: 'Failed to delete evidence' });
    }
  }
);

export default router;
