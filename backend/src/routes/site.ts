import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({ include: { deployments: true } });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  const { name, address, latitude, longitude, radius } = req.body;
  try {
    const site = await prisma.site.create({
      data: { name, address, latitude: parseFloat(latitude), longitude: parseFloat(longitude), radius: parseFloat(radius) }
    });
    res.json(site);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create site' });
  }
});

export default router;
