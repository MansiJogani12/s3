import express from 'express';
import { getStudentDashboard, getStudentProfile, updateStudentProfile } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('STUDENT', 'ADMIN'));

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

export default router;
