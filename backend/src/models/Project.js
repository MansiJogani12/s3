import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'EDIT_REQUESTED', 'CHANGE_REQUESTED', 'CHANGE_APPROVED'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      required: true,
    },
    sgpCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SGPCycle',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    facultyGuideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    projectKey: {
      type: String,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    githubRepositoryUrl: {
      type: String,
      default: '',
    },
    domain: {
      type: String,
      default: 'Web Development',
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    problemStatement: {
      type: String,
      default: '',
    },
    objectives: [
      {
        type: String,
      },
    ],
    scope: {
      type: String,
      default: '',
    },
    expectedOutcome: {
      type: String,
      default: '',
    },
    innovation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'EDIT_REQUESTED', 'CHANGE_REQUESTED', 'CHANGE_APPROVED'],
      default: 'DRAFT',
    },
    similarityScore: {
      type: Number,
      default: 0,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    similarProjects: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        title: String,
        similarityPercentage: Number,
        reason: String,
      },
    ],
    statusHistory: [statusHistorySchema],
    isArchived: {
      type: Boolean,
      default: false,
    },
    changeRequests: [
      {
        fields: [String],
        reason: String,
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        requestedAt: { type: Date, default: Date.now },
        feedback: String
      }
    ],
    unlockedFields: [String],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
