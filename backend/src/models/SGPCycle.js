import mongoose from 'mongoose';

const sgpCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'SGP Cycle name is required (e.g. SGP-V 2026)'],
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for SGP Cycle'],
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic Year is required for SGP Cycle'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SGPCycle = mongoose.model('SGPCycle', sgpCycleSchema);
export default SGPCycle;
