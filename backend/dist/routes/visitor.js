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
// Get visitor logs (optionally filtered by siteId)
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { siteId } = req.query;
    try {
        const logs = yield prisma_1.default.visitorLog.findMany({
            where: siteId ? { siteId: String(siteId) } : undefined,
            include: { guard: { select: { name: true } }, site: { select: { name: true } } },
            orderBy: { checkInTime: 'desc' }
        });
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch visitor logs' });
    }
}));
// Create a new visitor log
router.post('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { siteId, name, purpose, vehicleNum } = req.body;
    const guardId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!guardId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (!siteId || !name || !purpose) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const log = yield prisma_1.default.visitorLog.create({
            data: {
                siteId,
                guardId,
                name,
                purpose,
                vehicleNum: vehicleNum || null,
            },
            include: { guard: { select: { name: true } }, site: { select: { name: true } } }
        });
        res.json(log);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create visitor log' });
    }
}));
// Update a visitor log (checkout)
router.put('/:id/checkout', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const log = yield prisma_1.default.visitorLog.update({
            where: { id: String(id) },
            data: { checkOutTime: new Date() }
        });
        res.json(log);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to checkout visitor' });
    }
}));
exports.default = router;
