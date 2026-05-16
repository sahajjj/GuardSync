import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get visitor logs (optionally filtered by siteId)
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { siteId } = req.query;
  try {
    const logs = await prisma.visitorLog.findMany({
      where: siteId ? { siteId: String(siteId) } : undefined,
      include: { guard: { select: { name: true } }, site: { select: { name: true } } },
      orderBy: { checkInTime: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor logs' });
  }
});

// Create a new visitor log
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { siteId, name, purpose, vehicleNum } = req.body;
  const guardId = req.user?.id;

  if (!guardId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!siteId || !name || !purpose) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const log = await prisma.visitorLog.create({
      data: {
        siteId,
        guardId,
        name,
        purpose,
        vehicleNum: vehicleNum || null,
      },
      include: { guard: { select: { name: true } }, site: { select: { name: true } } }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create visitor log' });
  }
});

// Update a visitor log (checkout)
router.put('/:id/checkout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const log = await prisma.visitorLog.update({
      where: { id: String(id) },
      data: { checkOutTime: new Date() }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to checkout visitor' });
  }
});

export default router;
