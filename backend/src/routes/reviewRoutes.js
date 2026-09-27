import express from 'express';
import { 
  createReview, 
  getAllReviews, 
  updateReview, 
  deleteReview,
  getAssignedReviews,
  submitReviewMarks,
  getStudentMarks,
  getReviewDetailsForStudent
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// ================= COORDINATOR ROUTES =================
router.post('/', authorize('COORDINATOR', 'ADMIN'), createReview);
router.get('/', authorize('COORDINATOR', 'ADMIN'), getAllReviews);
router.put('/:id', authorize('COORDINATOR', 'ADMIN'), updateReview);
router.delete('/:id', authorize('COORDINATOR', 'ADMIN'), deleteReview);

// ================= FACULTY ROUTES =================
router.get('/faculty/assigned', authorize('FACULTY', 'ADMIN'), getAssignedReviews);
router.post('/:id/marks', authorize('FACULTY', 'ADMIN'), submitReviewMarks);

// ================= STUDENT ROUTES =================
router.get('/student/marks', authorize('STUDENT'), getStudentMarks);
router.get('/student/schedules', authorize('STUDENT'), getReviewDetailsForStudent);

export default router;
