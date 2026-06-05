import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// GET /api/domains — list all domains with controls
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        controls: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json(domains);
  } catch {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// GET /api/domains/:id — single domain with controls
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: req.params.id },
      include: {
        controls: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }
    res.json(domain);
  } catch {
    res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

export default router;
