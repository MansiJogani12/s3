import mongoose from 'mongoose';

const proposalFeedbackSchema = new mongoose.Schema(
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
    action: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'REQUEST_REVISION', 'APPROVE_EDIT_REQUEST'],
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProposalFeedback = mongoose.model('ProposalFeedback', proposalFeedbackSchema);
export default ProposalFeedback;
