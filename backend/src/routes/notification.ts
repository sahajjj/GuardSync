import express, { Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get notifications for the logged in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch the notifications' });
  }
});

// Mark notification as read
router.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { read: true }
    });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update the notifications' });
  }
});

// Emergency Alert (Triggered by Guard)
router.post('/emergency', authenticate, async (req: AuthRequest, res: Response) => {
  const { siteId, message } = req.body;
  const guardName = req.user?.name;

  try {
    // 1. Create the Emergency Report
    await prisma.report.create({
      data: {
        siteId,
        authorId: req.user?.id || '',
        type: 'EMERGENCY',
        content: `🚨 EMERGENCY ALERT triggered stby ${guardName}: ${message}`
      }
    });

    // 2. Find all Admins and Supervisors to notify
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERVISOR'] } }
    });

    // 3. Create notifications for them
    const notificationData = admins.map(admin => ({
      userId: admin.id,
      type: 'EMERGENCY',
      message: `🚨 Emergency at site! Guard ${guardName} signal: ${message}`,
      read: false
    }));

    await prisma.notification.createMany({ data: notificationData });

    res.json({ status: 'Alert Broadcasted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to broadcast emergency' });
  }
});

export default router;
