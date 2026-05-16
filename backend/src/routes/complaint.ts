import express, { Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for complaint submissions
const complaintLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many complaints submitted, please try again later'
});

// Raise a complaint
router.post('/', authenticate, complaintLimiter, async (req: AuthRequest, res: Response) => {
  const { subject, content, siteId } = req.body;
  const clientId = req.user?.id;

  if (!clientId || req.user?.role !== 'CLIENT') {
    return res.status(403).json({ error: 'Only clients can raise complaints' });
  }

  // Validate subject length
  if (!subject || subject.length < 3 || subject.length > 200) {
    return res.status(400).json({ error: 'Subject must be between 3 and 200 characters' });
  }

  // Validate content length
  if (!content || content.length < 10 || content.length > 10000) {
    return res.status(400).json({ error: 'Content must be between 10 and 10000 characters' });
  }

  // Validate siteId format and existence
  if (!siteId || typeof siteId !== 'string') {
    return res.status(400).json({ error: 'Invalid site ID' });
  }

  // Validate that site exists
  const siteExists = await prisma.site.findUnique({ where: { id: siteId } });
  if (!siteExists) {
    return res.status(400).json({ error: 'Invalid site ID' });
  }

  try {
    const complaint = await prisma.complaint.create({
      data: {
        subject,
        content,
        clientId,
        siteId
      },
      include: { site: { select: { name: true } } }
    });

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    const notificationData = admins.map(admin => ({
      userId: admin.id,
      type: 'COMPLAINT',
      message: `📩 New Complaint from ${req.user?.name}: ${subject}`,
      read: false
    }));

    await prisma.notification.createMany({ data: notificationData });

    res.json(complaint);
  } catch (err: any) {
    console.error('Complaint creation error:', err);
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid site ID provided' });
    }
    res.status(500).json({ error: 'Failed to submit complaint', details: err.message });
  }
});

// Get complaints
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user || {};

  try {
    const where = role === 'CLIENT' ? { clientId: userId } : {};
    const complaints = await prisma.complaint.findMany({
      where,
      include: { 
        client: { select: { name: true } }, 
        site: { select: { name: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

export default router;