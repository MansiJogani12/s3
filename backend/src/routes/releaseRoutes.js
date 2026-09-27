import express from 'express';
import { 
  createRelease, 
  getReleasesByProject, 
  updateRelease, 
  deleteRelease 
} from '../controllers/releaseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Releases are usually managed by students in the project or faculty/admin
// Allowing STUDENT and FACULTY to manage releases
router.post('/', authorize('STUDENT', 'FACULTY', 'ADMIN'), createRelease);
router.get('/', getReleasesByProject); // Anyone authenticated in the project can view
router.put('/:id', authorize('STUDENT', 'FACULTY', 'ADMIN'), updateRelease);
router.delete('/:id', authorize('STUDENT', 'FACULTY', 'ADMIN'), deleteRelease);

export default router;
