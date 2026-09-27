import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import agileRoutes from './routes/agileRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import supervisionRoutes from './routes/supervisionRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import releaseRoutes from './routes/releaseRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TeamSync API operational',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/agile', agileRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/supervision', supervisionRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/faculty', facultyRoutes);
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
