import ProjectGroup from '../models/ProjectGroup.js';
import GroupMember from '../models/GroupMember.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { createGroupSchema, inviteMemberSchema, respondInviteSchema } from '../validators/groupValidator.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * @desc Create a new project group
 * @route POST /api/groups
 */
export const createGroup = async (req, res, next) => {
  try {
    const user = req.user;
    const validated = createGroupSchema.parse(req.body);

    // Check if student is already in an active group
    const existingMembership = await GroupMember.findOne({
      userId: user._id,
      status: 'ACCEPTED',
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to an active project group.',
      });
    }

    // Auto-generate group code e.g. GRP-2026-X8A2
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const groupCode = `GRP-${new Date().getFullYear()}-${randomCode}`;

    const group = await ProjectGroup.create({
      name: validated.name,
      code: groupCode,
      leaderId: user._id,
      sgpCycleId: validated.sgpCycleId || null,
      departmentId: validated.departmentId || null,
      status: 'FORMING',
    });

    // Add leader as accepted member
    const leaderMember = await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      role: 'LEADER',
      status: 'ACCEPTED',
    });

    await logAuditEvent({
      actor: user,
      action: 'GROUP_CREATED',
      targetEntity: 'ProjectGroup',
      targetId: group._id,
      details: { name: group.name, code: group.code },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      group,
      membership: leaderMember,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Join an existing group using Group Code (e.g. GRP-2026-X639)
 * @route POST /api/groups/join-by-code
 */
export const joinGroupByCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group Code is required.',
      });
    }

    const trimmedCode = code.trim().toUpperCase();

    // Check if student is already in an active group
    const existingMembership = await GroupMember.findOne({
      userId: user._id,
      status: 'ACCEPTED',
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to an active project group.',
      });
    }

    const group = await ProjectGroup.findOne({ code: trimmedCode });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: `No project group found with code '${trimmedCode}'.`,
      });
    }

    if (group.status === 'LOCKED' || group.status === 'DISBANDED') {
      return res.status(400).json({
        success: false,
        message: `Group '${group.name}' is ${group.status.toLowerCase()} and not accepting new members.`,
      });
    }

    // Check if already a member or invited
    let membership = await GroupMember.findOne({
      groupId: group._id,
      userId: user._id,
    });

    if (membership) {
      if (membership.status === 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this group.',
        });
      }
      membership.status = 'ACCEPTED';
      await membership.save();
    } else {
      membership = await GroupMember.create({
        groupId: group._id,
        userId: user._id,
        role: 'MEMBER',
        status: 'ACCEPTED',
      });
    }

    // Reject all other pending invitations for this student
    await GroupMember.updateMany(
      { userId: user._id, status: 'INVITED', _id: { $ne: membership._id } },
      { status: 'REJECTED' }
    );

    await logAuditEvent({
      actor: user,
      action: 'GROUP_JOINED_BY_CODE',
      targetEntity: 'ProjectGroup',
      targetId: group._id,
      details: { code: group.code },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Successfully joined group '${group.name}' (${group.code})!`,
      group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current student's group details and members
 * @route GET /api/groups/my-group
 */
export const getMyGroup = async (req, res, next) => {
  try {
    const user = req.user;

    const membership = await GroupMember.findOne({
      userId: user._id,
      status: 'ACCEPTED',
    }).populate('groupId');

    if (!membership || !membership.groupId) {
      // Check if student has pending invites
      const pendingInvites = await GroupMember.find({
        userId: user._id,
        status: 'INVITED',
      })
        .populate({
          path: 'groupId',
          populate: { path: 'leaderId', select: 'name email enrollmentNumber' },
        })
        .populate('invitedBy', 'name enrollmentNumber');

      return res.status(200).json({
        success: true,
        hasGroup: false,
        group: null,
        members: [],
        pendingInvites,
      });
    }

    const group = membership.groupId;

    // Get all accepted members
    const memberDocs = await GroupMember.find({
      groupId: group._id,
      status: 'ACCEPTED',
    }).populate({
      path: 'userId',
      select: 'name email enrollmentNumber role',
    });

    // Populate StudentProfiles for members
    const members = await Promise.all(
      memberDocs.map(async (m) => {
        const mObj = m.toJSON();
        const profile = await StudentProfile.findOne({ userId: m.userId._id }).select('skills interests bio semester');
        return {
          ...mObj,
          user: {
            ...mObj.userId,
            profile,
          },
        };
      })
    );

    // Get pending invites sent by this group
    const pendingGroupInvites = await GroupMember.find({
      groupId: group._id,
      status: 'INVITED',
    }).populate('userId', 'name enrollmentNumber email');

    res.status(200).json({
      success: true,
      hasGroup: true,
      group,
      userRoleInGroup: membership.role,
      members,
      pendingInvites: pendingGroupInvites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Invite a student to group
 * @route POST /api/groups/:id/invite
 */
export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { searchIdentifier } = inviteMemberSchema.parse(req.body);
    const user = req.user;

    const group = await ProjectGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Authorization: only leader can invite
    const callerMembership = await GroupMember.findOne({
      groupId: id,
      userId: user._id,
      status: 'ACCEPTED',
    });

    if (!callerMembership || callerMembership.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        message: 'Only the group leader can invite members.',
      });
    }

    // Find student by enrollment or email
    const trimmed = searchIdentifier.trim();
    const candidate = await User.findOne({
      role: 'STUDENT',
      $or: [
        { enrollmentNumber: trimmed.toUpperCase() },
        { email: trimmed.toLowerCase() },
      ],
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: `No student found matching '${searchIdentifier}'.`,
      });
    }

    // Check if candidate is already in an accepted group
    const candidateActiveGroup = await GroupMember.findOne({
      userId: candidate._id,
      status: 'ACCEPTED',
    });

    if (candidateActiveGroup) {
      return res.status(400).json({
        success: false,
        message: `Student '${candidate.name}' (${candidate.enrollmentNumber}) already belongs to a group.`,
      });
    }

    // Check existing invite
    const existingInvite = await GroupMember.findOne({
      groupId: id,
      userId: candidate._id,
    });

    if (existingInvite) {
      if (existingInvite.status === 'INVITED') {
        return res.status(400).json({
          success: false,
          message: `Student '${candidate.name}' has already been invited to this group.`,
        });
      }
      if (existingInvite.status === 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          message: `Student '${candidate.name}' is already a member of this group.`,
        });
      }
    }

    const invite = await GroupMember.create({
      groupId: id,
      userId: candidate._id,
      role: 'MEMBER',
      status: 'INVITED',
      invitedBy: user._id,
    });

    await logAuditEvent({
      actor: user,
      action: 'GROUP_MEMBER_INVITED',
      targetEntity: 'ProjectGroup',
      targetId: id,
      details: { invitedStudent: candidate.enrollmentNumber },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${candidate.name} (${candidate.enrollmentNumber}).`,
      invite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Respond to group invitation (Accept / Reject)
 * @route POST /api/groups/invites/:inviteId/respond
 */
export const respondInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const { action } = respondInviteSchema.parse(req.body);
    const user = req.user;

    const invite = await GroupMember.findById(inviteId);
    if (!invite || String(invite.userId) !== String(user._id)) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or not assigned to you.',
      });
    }

    if (invite.status !== 'INVITED') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been processed.',
      });
    }

    if (action === 'ACCEPT') {
      // Verify student didn't accept another group in parallel
      const existingAccepted = await GroupMember.findOne({
        userId: user._id,
        status: 'ACCEPTED',
      });

      if (existingAccepted) {
        return res.status(400).json({
          success: false,
          message: 'You already belong to another active group.',
        });
      }

      invite.status = 'ACCEPTED';
      await invite.save();

      // Reject all other pending invitations for this student
      await GroupMember.updateMany(
        { userId: user._id, status: 'INVITED' },
        { status: 'REJECTED' }
      );

      await logAuditEvent({
        actor: user,
        action: 'GROUP_INVITE_ACCEPTED',
        targetEntity: 'ProjectGroup',
        targetId: invite.groupId,
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Invitation accepted! You are now a member of the group.',
      });
    } else {
      invite.status = 'REJECTED';
      await invite.save();

      return res.status(200).json({
        success: true,
        message: 'Invitation rejected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Leave group
 * @route POST /api/groups/:id/leave
 */
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const membership = await GroupMember.findOne({
      groupId: id,
      userId: user._id,
      status: 'ACCEPTED',
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group.',
      });
    }

    const acceptedMembers = await GroupMember.find({
      groupId: id,
      status: 'ACCEPTED',
    });

    if (membership.role === 'LEADER' && acceptedMembers.length > 1) {
      // Reassign leader role to next accepted member
      const nextLeader = acceptedMembers.find((m) => String(m.userId) !== String(user._id));
      if (nextLeader) {
        nextLeader.role = 'LEADER';
        await nextLeader.save();
        await ProjectGroup.findByIdAndUpdate(id, { leaderId: nextLeader.userId });
      }
    }

    await GroupMember.findByIdAndDelete(membership._id);

    // If no members left, mark group disbanded
    const remainingCount = await GroupMember.countDocuments({ groupId: id, status: 'ACCEPTED' });
    if (remainingCount === 0) {
      await ProjectGroup.findByIdAndUpdate(id, { status: 'DISBANDED' });
    }

    await logAuditEvent({
      actor: user,
      action: 'GROUP_MEMBER_LEFT',
      targetEntity: 'ProjectGroup',
      targetId: id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'You have left the group.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List all groups (Coordinator / Admin oversight)
 * @route GET /api/groups
 */
export const getAllGroups = async (req, res, next) => {
  try {
    const { departmentId, sgpCycleId, search } = req.query;
    const query = {};

    if (departmentId) query.departmentId = departmentId;
    if (sgpCycleId) query.sgpCycleId = sgpCycleId;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { code: regex }];
    }

    const groups = await ProjectGroup.find(query)
      .populate('leaderId', 'name enrollmentNumber email')
      .populate('guideId', 'name email designation')
      .populate('coGuideId', 'name email designation')
      .populate('departmentId', 'name code')
      .populate('sgpCycleId', 'name')
      .sort({ createdAt: -1 });

    const groupsWithMembers = await Promise.all(
      groups.map(async (g) => {
        const members = await GroupMember.find({ groupId: g._id, status: 'ACCEPTED' })
          .populate('userId', 'name enrollmentNumber email');
        return {
          ...g.toJSON(),
          members,
        };
      })
    );

    res.status(200).json({
      success: true,
      groups: groupsWithMembers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark group as Ready for Proposal
 * @route PUT /api/groups/:id/ready
 */
export const markGroupReady = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const group = await ProjectGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const callerMembership = await GroupMember.findOne({
      groupId: id,
      userId: user._id,
      status: 'ACCEPTED',
    });

    if (!callerMembership || callerMembership.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        message: 'Only the group leader can mark the group as ready.',
      });
    }

    if (group.status !== 'FORMING') {
      return res.status(400).json({
        success: false,
        message: 'Group is not in the FORMING state.',
      });
    }

    const acceptedMembersCount = await GroupMember.countDocuments({
      groupId: id,
      status: 'ACCEPTED',
    });

    const minMembers = group.minMembers || 2;
    if (acceptedMembersCount < minMembers) {
      return res.status(400).json({
        success: false,
        message: `At least ${minMembers} members are required to proceed. Currently have ${acceptedMembersCount}.`,
      });
    }

    group.status = 'READY_FOR_PROPOSAL';
    await group.save();

    await logAuditEvent({
      actor: user,
      action: 'GROUP_MARKED_READY',
      targetEntity: 'ProjectGroup',
      targetId: id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Group is now Ready for Proposal.',
      group,
    });
  } catch (error) {
    next(error);
  }
};
