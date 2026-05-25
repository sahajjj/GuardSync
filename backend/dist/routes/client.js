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
// Get sites assigned to the logged-in client
router.get('/sites', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clientId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!clientId)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const sites = yield prisma_1.default.site.findMany({
            where: { clientId },
            include: {
                _count: {
                    select: { attendances: { where: { checkOutTime: null } } } // Guards currently on duty
                }
            }
        });
        res.json(sites);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
}));
// Get reports for the client's sites
router.get('/reports', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clientId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!clientId)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const reports = yield prisma_1.default.report.findMany({
            where: { site: { clientId } },
            include: { author: { select: { name: true, role: true } }, site: { select: { name: true } } },
            orderBy: { timestamp: 'desc' }
        });
        res.json(reports);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
}));
// Get attendance for the client's sites
router.get('/attendance', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clientId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!clientId)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const attendance = yield prisma_1.default.attendance.findMany({
            where: { site: { clientId } },
            include: { guard: { select: { name: true } }, site: { select: { name: true } } },
            orderBy: { checkInTime: 'desc' },
            take: 50
        });
        res.json(attendance);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
}));
exports.default = router;
