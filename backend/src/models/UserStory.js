import mongoose from 'mongoose';

const userStorySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    epicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic',
      default: null,
    },
    code: {
      type: String,
      required: true,
    },
    persona: {
      type: String,
      required: true,
      default: 'As a student',
    },
    action: {
      type: String,
      required: true,
      default: 'I want to view my tasks',
    },
    benefit: {
      type: String,
      required: true,
      default: 'So that I can complete my project on time',
    },
    storyPoints: {
      type: Number,
      enum: [1, 2, 3, 5, 8, 13],
      default: 3,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['BACKLOG', 'SPRINT', 'DONE'],
      default: 'BACKLOG',
    },
  },
  {
    timestamps: true,
  }
);

const UserStory = mongoose.model('UserStory', userStorySchema);
export default UserStory;
