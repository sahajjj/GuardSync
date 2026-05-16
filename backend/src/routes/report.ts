import express, { Request, Response } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
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
    cb(null, 'report_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { siteId, type, content } = req.body;
  const authorId = req.user?.id;

  if (!authorId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const report = await prisma.report.create({
      data: {
        siteId,
        type,
        content,
        authorId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      }
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: { author: true, site: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
