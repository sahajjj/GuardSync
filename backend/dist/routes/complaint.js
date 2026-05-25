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
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// Rate limiting for complaint submissions
const complaintLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many complaints submitted, please try again later'
});
// Raise a complaint
router.post('/', auth_1.authenticate, complaintLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { subject, content, siteId } = req.body;
    const clientId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!clientId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'CLIENT') {
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
    const siteExists = yield prisma_1.default.site.findUnique({ where: { id: siteId } });
    if (!siteExists) {
        return res.status(400).json({ error: 'Invalid site ID' });
    }
    try {
        const complaint = yield prisma_1.default.complaint.create({
            data: {
                subject,
                content,
                clientId,
                siteId
            },
            include: { site: { select: { name: true } } }
        });
        // Notify Admins
        const admins = yield prisma_1.default.user.findMany({ where: { role: 'ADMIN' } });
        const notificationData = admins.map(admin => {
            var _a;
            return ({
                userId: admin.id,
                type: 'COMPLAINT',
                message: `📩 New Complaint from ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.name}: ${subject}`,
                read: false
            });
        });
        yield prisma_1.default.notification.createMany({ data: notificationData });
        res.json(complaint);
    }
    catch (err) {
        console.error('Complaint creation error:', err);
        if (err.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid site ID provided' });
        }
        res.status(500).json({ error: 'Failed to submit complaint', details: err.message });
    }
}));
// Get complaints
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: userId, role } = req.user || {};
    try {
        const where = role === 'CLIENT' ? { clientId: userId } : {};
        const complaints = yield prisma_1.default.complaint.findMany({
            where,
            include: {
                client: { select: { name: true } },
                site: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(complaints);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
}));
exports.default = router;
