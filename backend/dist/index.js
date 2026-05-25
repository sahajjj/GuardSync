"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const site_1 = __importDefault(require("./routes/site"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const report_1 = __importDefault(require("./routes/report"));
const visitor_1 = __importDefault(require("./routes/visitor"));
const client_1 = __importDefault(require("./routes/client"));
const complaint_1 = __importDefault(require("./routes/complaint"));
const stats_1 = __importDefault(require("./routes/stats"));
const notification_1 = __importDefault(require("./routes/notification"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Trust proxy is required for rate-limiting to work correctly on platforms like Vercel/Render
app.set('trust proxy', 1);
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'https://guard-sync-taupe.vercel.app',
        'https://guardsync-app.vercel.app'
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/sites', site_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/reports', report_1.default);
app.use('/api/visitors', visitor_1.default);
app.use('/api/client', client_1.default);
app.use('/api/complaints', complaint_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/notifications', notification_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GuardSync API is running' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
