import ProjectGroup from '../models/ProjectGroup.js';
import Project from '../models/Project.js';
import GroupMember from '../models/GroupMember.js';
import Task from '../models/Task.js';
import Proposal from '../models/Project.js'; // Using Project for proposals

export const getMyAssignedGroups = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    // Backward compatibility: Find projects where this faculty is the guide
    const legacyProjects = await Project.find({ facultyGuideId: facultyId }).lean();
    const legacyGroupIds = legacyProjects.map(p => p.groupId);

    // Fetch all groups where the logged-in faculty is the guide (Coordinator assigned) OR legacy project guide
    const groups = await ProjectGroup.find({ 
      $or: [
        { guideId: facultyId },
        { _id: { $in: legacyGroupIds } }
      ]
    })
      .populate('leaderId', 'name enrollmentNumber')
      .lean();

    const summary = {
      totalGroups: groups.length,
      pendingProposals: 0,
      pendingReviews: 0,
      overdueTasks: 0,
      upcomingEvaluations: 0,
    };

    const groupDetails = await Promise.all(groups.map(async (group) => {
      // Get student count for this group
      const studentCount = await GroupMember.countDocuments({ groupId: group._id, status: 'ACCEPTED' });
      summary.totalStudents += studentCount;

      // Get projects/proposals for this group
      const projects = await Project.find({ groupId: group._id }).lean();
      
      const activeProject = projects.find(p => p.status === 'DEVELOPMENT_ACTIVE' || p.status === 'APPROVED');
      if (activeProject) summary.activeProjects += 1;

      const pendingProposals = projects.filter(p => ['SUBMITTED', 'CHANGE_REQUESTED'].includes(p.status));
      summary.pendingProposals += pendingProposals.length;
      
      // Placeholder for upcoming evaluations (this can be calculated from milestone/review dates later)
      summary.upcomingEvaluations += 0; 

      // Calculate progress and tasks for the active project
      let progress = 0;
      let pendingTasksCount = 0;
      let overdueTasksCount = 0;

      if (activeProject) {
        const totalTasks = await Task.countDocuments({ projectId: activeProject._id });
        const doneTasks = await Task.countDocuments({ projectId: activeProject._id, status: 'DONE' });
        if (totalTasks > 0) progress = Math.round((doneTasks / totalTasks) * 100);
        
        pendingTasksCount = await Task.countDocuments({ projectId: activeProject._id, status: { $ne: 'DONE' } });
        
        const overdueTasks = await Task.countDocuments({ 
          projectId: activeProject._id, 
          status: { $ne: 'DONE' },
          dueDate: { $lt: new Date() }
        });
        overdueTasksCount = overdueTasks;
        summary.overdueTasks += overdueTasks;
      }

      return {
        ...group,
        studentCount,
        activeProject: activeProject || null,
        pendingReviewsCount: pendingProposals.length,
        progress,
        overdueTasksCount
      };
    }));

    res.status(200).json({ 
      success: true, 
      summary,
      groups: groupDetails 
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupContext = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const facultyId = req.user._id;

    // Backward compatibility check
    const legacyProjects = await Project.find({ facultyGuideId: facultyId }).lean();
    const legacyGroupIds = legacyProjects.map(p => String(p.groupId));

    // Verify ownership
    const group = await ProjectGroup.findOne({ 
      _id: groupId,
      $or: [
        { guideId: facultyId },
        { _id: { $in: legacyGroupIds } }
      ]
    })
      .populate('leaderId', 'name email enrollmentNumber department')
      .lean();
    if (!group) {
      return res.status(403).json({ success: false, message: 'Access Denied: Not assigned to this group' });
    }

    const members = await GroupMember.find({ groupId: group._id, status: 'ACCEPTED' })
      .populate('userId', 'name email enrollmentNumber department')
      .lean();

    const projects = await Project.find({ groupId: group._id }).lean();
    const activeProject = projects.find(p => p.status === 'DEVELOPMENT_ACTIVE' || p.status === 'APPROVED');

    res.status(200).json({
      success: true,
      group: { ...group, members },
      project: activeProject || null
    });
  } catch (error) {
    next(error);
  }
};
