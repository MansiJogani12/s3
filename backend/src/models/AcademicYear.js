import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema(
  {
    yearLabel: {
      type: String,
      required: [true, 'Academic year label is required (e.g. 2025-2026)'],
      trim: true,
      unique: true,
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

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
export default AcademicYear;
