import express from 'express';
import {
  getGuidanceLogs,
  createGuidanceLog,
  getFacultySupervisionSummary,
  getTeammatesForEval,
  submitPeerEvaluation,
  getPeerEvaluations,
} from '../controllers/supervisionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Faculty Guidance Logbook
router.get('/guidance', getGuidanceLogs);
router.post('/guidance', authorize('FACULTY', 'ADMIN', 'COORDINATOR'), createGuidanceLog);

// Faculty Supervision Summary Dashboard
router.get('/summary', authorize('FACULTY', 'ADMIN', 'COORDINATOR'), getFacultySupervisionSummary);

// Peer Evaluations
router.get('/teammates', authorize('STUDENT', 'ADMIN'), getTeammatesForEval);
router.post('/peer-evaluations', authorize('STUDENT', 'ADMIN'), submitPeerEvaluation);
router.get('/peer-evaluations', getPeerEvaluations);

export default router;
