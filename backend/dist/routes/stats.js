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
router.get('/summary', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [siteCount, guardCount, activeGuards, todayIncidents] = yield Promise.all([
            prisma_1.default.site.count(),
            prisma_1.default.user.count({ where: { role: 'GUARD' } }),
            prisma_1.default.attendance.count({ where: { checkOutTime: null } }),
            prisma_1.default.report.count({ where: { timestamp: { gte: today }, type: 'INCIDENT' } })
        ]);
        res.json({
            siteCount,
            guardCount,
            activeGuards,
            todayIncidents
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
}));
router.get('/site-performance', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield prisma_1.default.site.findMany({
            include: {
                _count: {
                    select: {
                        attendances: true,
                        reports: { where: { type: 'INCIDENT' } }
                    }
                }
            }
        });
        const performance = sites.map(s => ({
            id: s.id,
            name: s.name,
            totalAttendance: s._count.attendances,
            totalIncidents: s._count.reports
        }));
        res.json(performance);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch site performance' });
    }
}));
router.get('/monthly-attendance', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const guards = yield prisma_1.default.user.findMany({
            where: { role: 'GUARD' },
            select: {
                id: true,
                name: true,
                attendances: {
                    where: { checkInTime: { gte: startOfMonth } },
                    select: { id: true, checkInTime: true }
                }
            }
        });
        const report = guards.map(g => {
            const uniqueDays = new Set(g.attendances.map(a => a.checkInTime.toDateString())).size;
            return {
                id: g.id,
                name: g.name,
                daysWorked: uniqueDays,
                totalShifts: g.attendances.length
            };
        });
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch monthly attendance' });
    }
}));
exports.default = router;
