import express from 'express';
import {
  getAnalyticsDashboard,
  getAuditLogs,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  handleNotificationAction,
  getSystemConfigs,
  updateSystemConfig,
} from '../controllers/platformController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Analytics & KPIs
router.get('/analytics', authorize('ADMIN', 'COORDINATOR'), getAnalyticsDashboard);

// Audit Logs
router.get('/audit-logs', authorize('ADMIN'), getAuditLogs);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', authorize('STUDENT', 'FACULTY', 'COORDINATOR', 'ADMIN'), markAllNotificationsRead);
router.put('/notifications/:id/read', authorize('STUDENT', 'FACULTY', 'COORDINATOR', 'ADMIN'), markNotificationRead);
router.put('/notifications/:id/action', authorize('STUDENT', 'FACULTY', 'COORDINATOR', 'ADMIN'), handleNotificationAction);

// Platform Settings & AI Config
router.get('/settings', authorize('ADMIN'), getSystemConfigs);
router.post('/settings', authorize('ADMIN'), updateSystemConfig);

export default router;
