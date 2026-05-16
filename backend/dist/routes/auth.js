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
const prisma_1 = __importDefault(require("../prisma"));
const router = express_1.default.Router();
// Mock OTP login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        res.status(400).json({ error: 'Phone and OTP are required' });
        return;
    }
    if (otp !== '123456') {
        res.status(401).json({ error: 'Invalid OTP' });
        return;
    }
    try {
        let user = yield prisma_1.default.user.findUnique({ where: { phone } });
        if (!user) {
            // Auto-register guard for MVP purposes if not found
            user = yield prisma_1.default.user.create({
                data: { name: 'Demo User', phone, role: 'ADMIN' } // Making them admin so they can test everything
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
        res.json({ user, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Admin registers a user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phone, role } = req.body;
    try {
        const user = yield prisma_1.default.user.create({
            data: { name, phone, role }
        });
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create user' });
    }
}));
exports.default = router;
