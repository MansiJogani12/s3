import express from 'express';
import {
  createGroup,
  joinGroupByCode,
  getMyGroup,
  inviteMember,
  respondInvite,
  leaveGroup,
  getAllGroups,
  markGroupReady,
} from '../controllers/groupController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('STUDENT', 'ADMIN'), createGroup);
router.post('/join-by-code', authorize('STUDENT', 'ADMIN'), joinGroupByCode);
router.get('/my-group', getMyGroup);
router.post('/:id/invite', authorize('STUDENT', 'ADMIN'), inviteMember);
router.post('/invites/:inviteId/respond', respondInvite);
router.post('/:id/leave', leaveGroup);
router.put('/:id/ready', authorize('STUDENT', 'ADMIN'), markGroupReady);
router.get('/', authorize('ADMIN', 'COORDINATOR', 'FACULTY'), getAllGroups);

export default router;
