import express from 'express';
import {
  getPipelineRuns,
  triggerPipelineRun,
  getQualitySummary,
} from '../controllers/qaController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Pipelines
router.get('/pipelines', getPipelineRuns);
router.post('/pipelines/trigger', authorize('STUDENT', 'ADMIN'), triggerPipelineRun);

// Quality Summary
router.get('/quality-summary', getQualitySummary);

export default router;
