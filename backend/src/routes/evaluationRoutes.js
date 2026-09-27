import express from 'express';
import {
  getCriteria,
  createCriteria,
  updateCriteria,
  deleteCriteria,
  getReviewSchedules,
  createReviewSchedule,
  updateReviewSchedule,
  deleteReviewSchedule,
  submitStudentMarks,
  getStudentMarks,
} from '../controllers/evaluationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Evaluation Rubrics / Criteria
router.get('/criteria', getCriteria);
router.post('/criteria', authorize('ADMIN', 'COORDINATOR'), createCriteria);
router.put('/criteria/:id', authorize('ADMIN', 'COORDINATOR'), updateCriteria);
router.delete('/criteria/:id', authorize('ADMIN', 'COORDINATOR'), deleteCriteria);

// Review Schedules
router.get('/reviews', getReviewSchedules);
router.post('/reviews', authorize('ADMIN', 'COORDINATOR'), createReviewSchedule);
router.put('/reviews/:id', authorize('ADMIN', 'COORDINATOR'), updateReviewSchedule);
router.delete('/reviews/:id', authorize('ADMIN', 'COORDINATOR'), deleteReviewSchedule);

// Marking Engine
router.post('/marks', authorize('FACULTY', 'ADMIN', 'COORDINATOR'), submitStudentMarks);
router.get('/marks', getStudentMarks);

export default router;
