import mongoose from 'mongoose';

const reviewScheduleSchema = new mongoose.Schema(
  {
    reviewName: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      enum: ['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL_VIVA'],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      default: 'Main Seminar Hall / Lab 3',
    },
    description: {
      type: String,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const ReviewSchedule = mongoose.model('ReviewSchedule', reviewScheduleSchema);
export default ReviewSchedule;
