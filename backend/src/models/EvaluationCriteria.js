import mongoose from 'mongoose';

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weightagePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const EvaluationCriteria = mongoose.model('EvaluationCriteria', evaluationCriteriaSchema);
export default EvaluationCriteria;
