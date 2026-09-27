import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  getSgpCycles,
  createSgpCycle,
  updateSgpCycle,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// User routes
router.get('/users', authorize('ADMIN', 'COORDINATOR'), getUsers);
router.post('/users', authorize('ADMIN', 'COORDINATOR'), createUser);
router.put('/users/:id', authorize('ADMIN', 'COORDINATOR'), updateUser);
router.patch('/users/:id/status', authorize('ADMIN', 'COORDINATOR'), toggleUserStatus);
router.post('/users/:id/reset-password', authorize('ADMIN', 'COORDINATOR'), resetUserPassword);

// Department routes
router.get('/departments', authorize('ADMIN', 'COORDINATOR'), getDepartments);
router.post('/departments', authorize('ADMIN'), createDepartment);
router.put('/departments/:id', authorize('ADMIN'), updateDepartment);

// Academic Year routes
router.get('/academic-years', authorize('ADMIN', 'COORDINATOR'), getAcademicYears);
router.post('/academic-years', authorize('ADMIN'), createAcademicYear);
router.put('/academic-years/:id', authorize('ADMIN'), updateAcademicYear);

// SGP Cycle routes
router.get('/sgp-cycles', authorize('ADMIN', 'COORDINATOR'), getSgpCycles);
router.post('/sgp-cycles', authorize('ADMIN', 'COORDINATOR'), createSgpCycle);
router.put('/sgp-cycles/:id', authorize('ADMIN', 'COORDINATOR'), updateSgpCycle);

export default router;
