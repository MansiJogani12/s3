import mongoose from 'mongoose';

const studentMarkSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewStage: {
      type: String,
      enum: ['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL_VIVA'],
      default: 'REVIEW_1',
    },
    criteriaScores: [
      {
        criteriaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EvaluationCriteria',
        },
        criteriaName: String,
        weightagePercentage: Number,
        marksObtained: Number,
        maxMarks: Number,
      },
    ],
    totalMarksObtained: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'F'],
      required: true,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studentMarkSchema.index({ projectId: 1, studentId: 1, reviewStage: 1, evaluatorId: 1 }, { unique: true });

const StudentMark = mongoose.model('StudentMark', studentMarkSchema);
export default StudentMark;
