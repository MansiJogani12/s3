import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: ['OFFICIAL', 'FACULTY'],
      default: 'OFFICIAL'
    },
    expectedProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    requirements: [{
      text: String,
      isCompleted: { type: Boolean, default: false }
    }],
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
      default: 'NOT_STARTED',
    },
    facultyFeedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Milestone = mongoose.model('Milestone', milestoneSchema);
export default Milestone;
