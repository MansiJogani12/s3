import express from 'express';
import { getMyAssignedGroups, getGroupContext } from '../controllers/facultyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('FACULTY'));

router.get('/groups', getMyAssignedGroups);
router.get('/groups/:groupId', getGroupContext);

export default router;
