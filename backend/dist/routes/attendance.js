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
const multer_1 = __importDefault(require("multer"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const haversine_1 = require("../utils/haversine");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/checkin', auth_1.authenticate, upload.single('selfie'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { siteId, latitude, longitude } = req.body;
    const guardId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!guardId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const site = yield prisma_1.default.site.findUnique({ where: { id: siteId } });
        if (!site) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }
        const distance = (0, haversine_1.getDistance)(site.latitude, site.longitude, parseFloat(latitude), parseFloat(longitude));
        if (distance > site.radius) {
            res.status(400).json({ error: 'Outside geo-fence' });
            return;
        }
        const attendance = yield prisma_1.default.attendance.create({
            data: {
                guardId,
                siteId,
                checkInTime: new Date(),
                checkInLat: parseFloat(latitude),
                checkInLng: parseFloat(longitude),
                selfieUrl: req.file ? `/uploads/${req.file.filename}` : null,
            }
        });
        res.json(attendance);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check in' });
    }
}));
router.post('/checkout', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { attendanceId, latitude, longitude } = req.body;
    try {
        const attendance = yield prisma_1.default.attendance.update({
            where: { id: attendanceId },
            data: {
                checkOutTime: new Date(),
                checkOutLat: parseFloat(latitude),
                checkOutLng: parseFloat(longitude),
            }
        });
        res.json(attendance);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check out' });
    }
}));
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attendances = yield prisma_1.default.attendance.findMany({
            include: { guard: true, site: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(attendances);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
}));
exports.default = router;
