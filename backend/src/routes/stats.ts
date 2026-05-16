import express, { Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [siteCount, guardCount, activeGuards, todayIncidents] = await Promise.all([
      prisma.site.count(),
      prisma.user.count({ where: { role: 'GUARD' } }),
      prisma.attendance.count({ where: { checkOutTime: null } }),
      prisma.report.count({ where: { timestamp: { gte: today }, type: 'INCIDENT' } })
    ]);

    res.json({
      siteCount,
      guardCount,
      activeGuards,
      todayIncidents
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.get('/site-performance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      include: {
        _count: {
          select: {
            attendances: true,
            reports: { where: { type: 'INCIDENT' } }
          }
        }
      }
    });

    const performance = sites.map(s => ({
      id: s.id,
      name: s.name,
      totalAttendance: s._count.attendances,
      totalIncidents: s._count.reports
    }));

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site performance' });
  }
});

router.get('/monthly-attendance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const guards = await prisma.user.findMany({
      where: { role: 'GUARD' },
      select: {
        id: true,
        name: true,
        attendances: {
          where: { checkInTime: { gte: startOfMonth } },
          select: { id: true, checkInTime: true }
        }
      }
    });

    const report = guards.map(g => {
      const uniqueDays = new Set(g.attendances.map(a => a.checkInTime.toDateString())).size;
      return {
        id: g.id,
        name: g.name,
        daysWorked: uniqueDays,
        totalShifts: g.attendances.length
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly attendance' });
  }
});

export default router;
