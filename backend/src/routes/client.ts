import express, { Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get sites assigned to the logged-in client
router.get('/sites', authenticate, async (req: AuthRequest, res: Response) => {
  const clientId = req.user?.id;
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sites = await prisma.site.findMany({
      where: { clientId },
      include: {
        _count: {
          select: { attendances: { where: { checkOutTime: null } } } // Guards currently on duty
        }
      }
    });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Get reports for the client's sites
router.get('/reports', authenticate, async (req: AuthRequest, res: Response) => {
  const clientId = req.user?.id;
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const reports = await prisma.report.findMany({
      where: { site: { clientId } },
      include: { author: { select: { name: true, role: true } }, site: { select: { name: true } } },
      orderBy: { timestamp: 'desc' }
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get attendance for the client's sites
router.get('/attendance', authenticate, async (req: AuthRequest, res: Response) => {
  const clientId = req.user?.id;
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const attendance = await prisma.attendance.findMany({
      where: { site: { clientId } },
      include: { guard: { select: { name: true } }, site: { select: { name: true } } },
      orderBy: { checkInTime: 'desc' },
      take: 50
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

export default router;
