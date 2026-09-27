import mongoose from 'mongoose';

const reviewMarkSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED'],
      default: 'DRAFT',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student only gets marked once per review by a specific faculty (or just per review)
reviewMarkSchema.index({ reviewId: 1, studentId: 1 }, { unique: true });

const ReviewMark = mongoose.model('ReviewMark', reviewMarkSchema);
export default ReviewMark;
