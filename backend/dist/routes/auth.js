"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../prisma"));
const router = express_1.default.Router();
// ── Profile photo upload config ──
const profileUploadDir = path_1.default.join(__dirname, '../../uploads/profiles');
if (!fs_1.default.existsSync(profileUploadDir)) {
    fs_1.default.mkdirSync(profileUploadDir, { recursive: true });
}
const profileStorage = multer_1.default.diskStorage({
    destination: profileUploadDir,
    filename: (req, file, cb) => {
        cb(null, `profile_${Date.now()}${path_1.default.extname(file.originalname) || '.jpg'}`);
    }
});
const uploadPhoto = (0, multer_1.default)({ storage: profileStorage });
// ── In-memory OTP store ──
// Map<phone, { otp: string, expiresAt: number }>
const otpStore = new Map();
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// ── Public Signup (First user becomes ADMIN) ──
router.post('/signup', uploadPhoto.single('photo'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phone } = req.body;
    if (!name || !phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        res.status(400).json({ error: 'Name and valid 10-digit phone are required' });
        return;
    }
    try {
        const userCount = yield prisma_1.default.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'GUARD';
        const user = yield prisma_1.default.user.create({
            data: {
                name,
                phone,
                role,
                photoUrl: req.file ? `/uploads/profiles/${req.file.filename}` : null
            }
        });
        res.json({ message: 'Registration successful!', user });
    }
    catch (error) {
        res.status(400).json({ error: 'User already exists with this phone number.' });
    }
}));
// ── Send OTP ──
router.post('/send-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        res.status(400).json({ error: 'Valid 10-digit phone number is required' });
        return;
    }
    // Check if user exists
    const user = yield prisma_1.default.user.findUnique({ where: { phone } });
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
}));
// ── Verify OTP & Login ──
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma_1.default.user.findUnique({ where: { phone } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
        res.json({ user, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// ── Admin registers a user (with profile photo) ──
router.post('/register', uploadPhoto.single('photo'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phone, role } = req.body;
    try {
        const user = yield prisma_1.default.user.create({
            data: {
                name,
                phone,
                role,
                photoUrl: req.file ? `/uploads/profiles/${req.file.filename}` : null,
            }
        });
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create user — phone may already exist' });
    }
}));
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// ── Update User (Admin only) ──
router.put('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { name, phone, role } = req.body;
    try {
        const user = yield prisma_1.default.user.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (phone && { phone })), (role && { role }))
        });
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update user' });
    }
}));
// ── Delete User (Admin only) ──
router.delete('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    // Verify JWT — only admins can delete
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Authorization required' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret123');
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
        const user = yield prisma_1.default.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Delete all related records first (no cascade in schema)
        yield prisma_1.default.$transaction([
            prisma_1.default.attendance.deleteMany({ where: { guardId: id } }),
            prisma_1.default.deployment.deleteMany({ where: { guardId: id } }),
            prisma_1.default.report.deleteMany({ where: { authorId: id } }),
            prisma_1.default.notification.deleteMany({ where: { userId: id } }),
            prisma_1.default.visitorLog.deleteMany({ where: { guardId: id } }),
            prisma_1.default.complaint.deleteMany({ where: { clientId: id } }),
            // Unlink client sites (set clientId to null instead of deleting sites)
            prisma_1.default.site.updateMany({ where: { clientId: id }, data: { clientId: null } }),
            prisma_1.default.user.delete({ where: { id } }),
        ]);
        // Clean up profile photo file if exists
        if (user.photoUrl) {
            const photoPath = path_1.default.join(__dirname, '../../', user.photoUrl);
            if (fs_1.default.existsSync(photoPath)) {
                fs_1.default.unlinkSync(photoPath);
            }
        }
        res.json({ message: `User "${user.name}" deleted successfully` });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
}));
exports.default = router;
