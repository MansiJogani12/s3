import mongoose from 'mongoose';

const projectGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Group code is required'],
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    sgpCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SGPCycle',
      required: false,
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
      default: null,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['FORMING', 'ACTIVE', 'LOCKED', 'DISBANDED'],
      default: 'FORMING',
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    coGuideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectGroup = mongoose.model('ProjectGroup', projectGroupSchema);
export default ProjectGroup;
