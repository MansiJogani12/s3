import express from 'express';
import { getCalendarEvents } from '../controllers/calendarController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Calendar Events (Unified Endpoint)
router.get('/events', getCalendarEvents);

export default router;
