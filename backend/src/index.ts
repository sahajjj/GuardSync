import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import siteRoutes from './routes/site';
import attendanceRoutes from './routes/attendance';
import reportRoutes from './routes/report';
import visitorRoutes from './routes/visitor';
import clientRoutes from './routes/client';
import complaintRoutes from './routes/complaint';
import statsRoutes from './routes/stats';
import notificationRoutes from './routes/notification';

dotenv.config();

const app = express();

// Trust proxy is required for rate-limiting to work correctly on platforms like Vercel/Render
app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GuardSync API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
