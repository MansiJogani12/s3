import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    taskKey: {
      type: String,
      required: true,
    },
    taskNumber: {
      type: Number,
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
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feature',
      default: null,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    checklistItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      default: 'TO_DO',
    },
    storyPoints: {
      type: Number,
      default: 1,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    dueTime: {
      type: String,
      default: '',
    },
    isCalendarEventOnly: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ projectId: 1, taskNumber: 1 }, { unique: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;
