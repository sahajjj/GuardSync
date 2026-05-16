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
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield prisma_1.default.site.findMany({ include: { deployments: true } });
        res.json(sites);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
}));
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, address, latitude, longitude, radius } = req.body;
    try {
        const site = yield prisma_1.default.site.create({
            data: { name, address, latitude: parseFloat(latitude), longitude: parseFloat(longitude), radius: parseFloat(radius) }
        });
        res.json(site);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to create site' });
    }
}));
exports.default = router;
