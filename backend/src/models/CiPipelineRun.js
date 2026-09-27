import mongoose from 'mongoose';

const ciPipelineRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    runNumber: {
      type: Number,
      required: true,
    },
    commitHash: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    trigger: {
      type: String,
      enum: ['PUSH', 'PULL_REQUEST', 'MANUAL'],
      default: 'PUSH',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'IN_PROGRESS', 'CANCELLED'],
      default: 'SUCCESS',
    },
    durationSeconds: {
      type: Number,
      default: 45,
    },
    unitTestsPassed: {
      type: Number,
      default: 18,
    },
    unitTestsFailed: {
      type: Number,
      default: 0,
    },
    codeCoveragePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 88,
    },
    lintErrors: {
      type: Number,
      default: 0,
    },
    securityVulnerabilities: {
      type: Number,
      default: 0,
    },
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'A',
    },
    logs: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const CiPipelineRun = mongoose.model('CiPipelineRun', ciPipelineRunSchema);
export default CiPipelineRun;
