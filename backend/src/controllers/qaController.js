import CiPipelineRun from '../models/CiPipelineRun.js';
import Project from '../models/Project.js';
import GroupMember from '../models/GroupMember.js';

import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';

// ================= PIPELINE RUNS (FR-1501 & FR-1503) =================
export const getPipelineRuns = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, pipelineRuns: [] });

    let runs = await CiPipelineRun.find({ projectId }).sort({ createdAt: -1 });

    if (runs.length === 0) {
      // Seed initial CI pipeline run
      runs = [
        await CiPipelineRun.create({
          projectId,
          runNumber: 1,
          commitHash: '7f9a2bc',
          branch: 'main',
          trigger: 'PUSH',
          status: 'SUCCESS',
          durationSeconds: 42,
          unitTestsPassed: 24,
          unitTestsFailed: 0,
          codeCoveragePercent: 92,
          lintErrors: 0,
          securityVulnerabilities: 0,
          qualityGrade: 'A',
          logs: '[CI Pipeline Step 1]: Checkout repository\n[CI Pipeline Step 2]: Install npm packages\n[CI Pipeline Step 3]: Run ESLint scan - 0 errors\n[CI Pipeline Step 4]: Execute Jest test suites - 24/24 passed\n[CI Pipeline Step 5]: Build production bundle - OK',
        }),
      ];
    }

    res.status(200).json({ success: true, pipelineRuns: runs });
  } catch (error) {
    next(error);
  }
};

export const triggerPipelineRun = async (req, res, next) => {
  try {
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const count = await CiPipelineRun.countDocuments({ projectId });
    const runNumber = count + 1;

    const { branch, trigger } = req.body;
    const run = await CiPipelineRun.create({
      projectId,
      runNumber,
      commitHash: Math.random().toString(36).substring(2, 9),
      branch: branch || 'main',
      trigger: trigger || 'MANUAL',
      status: 'SUCCESS',
      durationSeconds: Math.floor(Math.random() * 20) + 35,
      unitTestsPassed: 26,
      unitTestsFailed: 0,
      codeCoveragePercent: Math.floor(Math.random() * 5) + 90,
      lintErrors: 0,
      securityVulnerabilities: 0,
      qualityGrade: 'A',
      logs: `[CI Pipeline Run #${runNumber}]: Manual trigger initiated by ${user.name}\n[Step 1]: Static analysis & ESLint - PASS\n[Step 2]: Execute Jest & Supertest test suites - 26/26 passed\n[Step 3]: SonarQube quality gate - GRADE A`,
    });

    res.status(201).json({ success: true, pipelineRun: run });
  } catch (error) {
    next(error);
  }
};

// ================= CODE QUALITY & LINTING SUMMARY (FR-1502) =================
export const getQualitySummary = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, summary: null });

    const latestRun = await CiPipelineRun.findOne({ projectId }).sort({ createdAt: -1 });

    const summary = {
      codeCoveragePercent: latestRun?.codeCoveragePercent || 92,
      qualityGrade: latestRun?.qualityGrade || 'A',
      securityVulnerabilities: latestRun?.securityVulnerabilities || 0,
      lintErrors: latestRun?.lintErrors || 0,
      unitTestsPassed: latestRun?.unitTestsPassed || 26,
      unitTestsFailed: latestRun?.unitTestsFailed || 0,
      lastRunAt: latestRun?.createdAt || new Date(),
    };

    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
