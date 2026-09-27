import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema(
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
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TO_DO', 'IN_PROGRESS', 'DONE'],
      default: 'TO_DO',
    },
    startDate: {
      type: Date,
      default: null,
    },
    targetEndDate: {
      type: Date,
      default: null,
    },
    checklistItems: [
      {
        name: { type: String, required: true },
        isCompleted: { type: Boolean, default: false }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feature = mongoose.model('Feature', featureSchema);
export default Feature;
