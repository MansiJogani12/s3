import mongoose from 'mongoose';

const facultyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
      trim: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
export default FacultyProfile;
