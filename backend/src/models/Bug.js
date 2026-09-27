import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    bugKey: {
      type: String,
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

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED', 'REOPENED'],
      default: 'OPEN',
    },
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feature',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bug = mongoose.model('Bug', bugSchema);
export default Bug;
