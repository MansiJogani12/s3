import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['LEADER', 'MEMBER'],
      default: 'MEMBER',
    },
    status: {
      type: String,
      enum: ['INVITED', 'ACCEPTED', 'REJECTED'],
      default: 'ACCEPTED',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot be invited multiple times to the same group
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);
export default GroupMember;
