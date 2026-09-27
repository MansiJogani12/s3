import mongoose from 'mongoose';

const guidanceLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    discussionSummary: {
      type: String,
      required: true,
    },
    actionableItems: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    nextMeetingDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const GuidanceLog = mongoose.model('GuidanceLog', guidanceLogSchema);
export default GuidanceLog;
