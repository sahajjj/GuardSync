import express, { Request, Response } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDistance } from '../utils/haversine';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/checkin', authenticate, upload.single('selfie'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { siteId, latitude, longitude } = req.body;
  const guardId = req.user?.id;
  
  if (!guardId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    const distance = getDistance(site.latitude, site.longitude, parseFloat(latitude), parseFloat(longitude));
    console.log(`[CheckIn] Distance to site "${site.name}": ${distance.toFixed(2)}m (Radius: ${site.radius}m)`);
    if (distance > site.radius) {
      console.warn(`[CheckIn] WARNING: Guard is ${distance.toFixed(0)}m away from "${site.name}" (radius: ${site.radius}m) — allowing check-in with distance flag`);
    }

    const attendance = await prisma.attendance.create({
      data: {
        guardId,
        siteId,
        checkInTime: new Date(),
        checkInLat: parseFloat(latitude),
        checkInLng: parseFloat(longitude),
        selfieUrl: req.file ? `/uploads/${req.file.filename}` : null,
      }
    });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

router.post('/checkout', authenticate, upload.single('selfie'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { attendanceId, latitude, longitude } = req.body;
  
  try {
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: new Date(),
        checkOutLat: parseFloat(latitude),
        checkOutLng: parseFloat(longitude),
        checkOutSelfieUrl: req.file ? `/uploads/${req.file.filename}` : null,
      }
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check out' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: { guard: true, site: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

export default router;
