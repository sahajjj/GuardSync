import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';

const router = express.Router();

// ── Profile photo upload config ──
const profileUploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: profileUploadDir,
  filename: (req, file, cb) => {
    cb(null, `profile_${Date.now()}${path.extname(file.originalname) || '.jpg'}`);
  }
});
const uploadPhoto = multer({ storage: profileStorage });

// ── In-memory OTP store ──
// Map<phone, { otp: string, expiresAt: number }>
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Public Signup (First user becomes ADMIN) ──
router.post('/signup', uploadPhoto.single('photo'), async (req: Request, res: Response): Promise<void> => {
  const { name, phone } = req.body;
  if (!name || !phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: 'Name and valid 10-digit phone are required' });
    return;
  }

  try {
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'GUARD';

    const user = await prisma.user.create({
      data: { 
        name, 
        phone, 
        role,
        photoUrl: req.file ? `/uploads/profiles/${req.file.filename}` : null
      }
    });
    res.json({ message: 'Registration successful!', user });
  } catch (error) {
    res.status(400).json({ error: 'User already exists with this phone number.' });
  }
});

// ── Send OTP ──
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    return;
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.status(404).json({ error: 'No account found with this phone number. Contact your admin.' });
    return;
  }

  // Generate and store OTP (expires in 5 minutes)
  const otp = generateOTP();
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  });

  console.log(`[OTP] ${phone} → ${otp} (expires in 5 min)`);

  // In production, you would send this via Twilio/MSG91 etc.
  // We return it in the response so the frontend can display it for demo/simulation purposes.
  res.json({
    message: 'OTP sent successfully',
    otp_preview: otp 
  });
});

// ── Verify OTP & Login ──
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  // Validate OTP
  const stored = otpStore.get(phone);
  if (!stored) {
    res.status(401).json({ error: 'No OTP was sent to this number. Please request a new one.' });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    return;
  }

  if (stored.otp !== otp) {
    res.status(401).json({ error: 'Incorrect OTP. Please try again.' });
    return;
  }

  // OTP valid — consume it (one-time use)
  otpStore.delete(phone);

  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '30d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin registers a user (with profile photo) ──
router.post('/register', uploadPhoto.single('photo'), async (req: Request, res: Response): Promise<void> => {
  const { name, phone, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        role,
        photoUrl: req.file ? `/uploads/profiles/${req.file.filename}` : null,
      }
    });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user — phone may already exist' });
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Delete User (Admin only) ──
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Verify JWT — only admins can delete
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as { id: string; role: string };

    if (decoded.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can delete users' });
      return;
    }

    // Prevent self-deletion
    if (decoded.id === id) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete all related records first (no cascade in schema)
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { guardId: id } }),
      prisma.deployment.deleteMany({ where: { guardId: id } }),
      prisma.report.deleteMany({ where: { authorId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.visitorLog.deleteMany({ where: { guardId: id } }),
      prisma.complaint.deleteMany({ where: { clientId: id } }),
      // Unlink client sites (set clientId to null instead of deleting sites)
      prisma.site.updateMany({ where: { clientId: id }, data: { clientId: null } }),
      prisma.user.delete({ where: { id } }),
    ]);

    // Clean up profile photo file if exists
    if (user.photoUrl) {
      const photoPath = path.join(__dirname, '../../', user.photoUrl);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    res.json({ message: `User "${user.name}" deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
