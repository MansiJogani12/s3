import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String, // e.g., 'Proposal Review', 'SRS Review', 'Mid-Term Review'
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      required: true,
    },
    reviewDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // e.g., "10:00 AM"
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'COMPLETED'],
      default: 'DRAFT',
    },
    marksVisibility: {
      type: String,
      enum: ['HIDDEN', 'VISIBLE'],
      default: 'HIDDEN',
    },
    assignedGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectGroup',
      }
    ],
    facultyReviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
