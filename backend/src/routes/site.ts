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
  const { name, address, latitude, longitude, radius, clientId } = req.body;
  try {
    const site = await prisma.site.create({
      data: { name, address, latitude: parseFloat(latitude), longitude: parseFloat(longitude), radius: parseFloat(radius), clientId: clientId || null }
    });
    res.json(site);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create site' });
  }
});

// Update a site
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, address, latitude, longitude, radius, clientId } = req.body;
  try {
    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(radius !== undefined && { radius: parseFloat(radius) }),
        clientId: clientId || null
      }
    });
    res.json(site);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update site' });
  }
});

// Delete a site
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    await prisma.attendance.deleteMany({ where: { siteId: id } });
    await prisma.deployment.deleteMany({ where: { siteId: id } });
    await prisma.report.deleteMany({ where: { siteId: id } });
    await prisma.visitorLog.deleteMany({ where: { siteId: id } });
    await prisma.site.delete({ where: { id } });
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete site' });
  }
});

export default router;
