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
const router = express_1.default.Router();
// Get notifications for the logged in user
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notifications = yield prisma_1.default.notification.findMany({
            where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch the notifications' });
    }
}));
// Mark notification as read
router.post('/:id/read', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield prisma_1.default.notification.update({
            where: { id: String(req.params.id) },
            data: { read: true }
        });
        res.json(notification);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update the notifications' });
    }
}));
// Emergency Alert (Triggered by Guard)
router.post('/emergency', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { siteId, message } = req.body;
    const guardName = (_a = req.user) === null || _a === void 0 ? void 0 : _a.name;
    try {
        // 1. Create the Emergency Report
        yield prisma_1.default.report.create({
            data: {
                siteId,
                authorId: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || '',
                type: 'EMERGENCY',
                content: `🚨 EMERGENCY ALERT triggered stby ${guardName}: ${message}`
            }
        });
        // 2. Find all Admins and Supervisors to notify
        const admins = yield prisma_1.default.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPERVISOR'] } }
        });
        // 3. Create notifications for them
        const notificationData = admins.map(admin => ({
            userId: admin.id,
            type: 'EMERGENCY',
            message: `🚨 Emergency at site! Guard ${guardName} signal: ${message}`,
            read: false
        }));
        yield prisma_1.default.notification.createMany({ data: notificationData });
        res.json({ status: 'Alert Broadcasted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to broadcast emergency' });
    }
}));
exports.default = router;
