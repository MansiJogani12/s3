import mongoose from 'mongoose';

const peerEvaluationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluateeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contributionScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    teamworkScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    technicalScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    communicationScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    overallScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

peerEvaluationSchema.index({ projectId: 1, evaluatorId: 1, evaluateeId: 1 }, { unique: true });

const PeerEvaluation = mongoose.model('PeerEvaluation', peerEvaluationSchema);
export default PeerEvaluation;
