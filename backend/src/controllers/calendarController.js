import Task from '../models/Task.js';
import Bug from '../models/Bug.js';
import Milestone from '../models/Milestone.js';
import Review from '../models/Review.js';
import Release from '../models/Release.js';
import User from '../models/User.js';
import Feature from '../models/Feature.js';
import ProjectGroup from '../models/ProjectGroup.js';
import Project from '../models/Project.js';
import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';

// ================= AGGREGATED CALENDAR EVENTS =================

export const getCalendarEvents = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);

    // If faculty and no specific projectId, we must filter by their assigned projects only
    let allowedProjectIds = [];
    if (!projectId && req.user.role === 'FACULTY') {
      const groups = await ProjectGroup.find({ guideId: req.user._id });
      const groupIds = groups.map(g => g._id);
      
      const legacyProjects = await Project.find({ facultyGuideId: req.user._id }).lean();
      
      const activeProjects = await Project.find({ groupId: { $in: groupIds } }).lean();
      
      const allProjectIds = [...legacyProjects.map(p => p._id), ...activeProjects.map(p => p._id)];
      // Remove duplicates
      allowedProjectIds = [...new Set(allProjectIds.map(id => String(id)))];
      
      if (allowedProjectIds.length === 0) {
        return res.status(200).json({ success: true, events: [] }); // No assigned groups
      }
    } else if (!projectId && req.user.role !== 'ADMIN' && req.user.role !== 'COORDINATOR') {
      return res.status(200).json({ success: true, events: [] }); // Unauthorized if not admin/coord and no project
    }

    // Coordinator mode: only fetch Coordinator's scheduled Reviews & Academic deadlines (No student tasks/bugs/features)
    if (req.user.role === 'COORDINATOR' && !projectId) {
      const reviews = await Review.find({}).populate('facultyReviewers', 'name');
      const events = reviews.map(review => ({
        id: `review-${review._id}`,
        title: `${review.title} (${review.startTime || 'Scheduled'})`,
        start: review.reviewDate,
        end: review.reviewDate,
        type: 'REVIEW',
        color: '#8b5cf6', // purple-500
        responsible: review.facultyReviewers?.length > 0 ? review.facultyReviewers.map(f => f.name).join(', ') : 'Department Coordinator',
        details: review
      }));

      return res.status(200).json({ success: true, events });
    }

    // Base filter
    const baseFilter = projectId 
      ? { projectId } 
      : allowedProjectIds.length > 0 
        ? { projectId: { $in: allowedProjectIds } }
        : {};

    // 1. Fetch Tasks (Blue)
    const taskFilter = { ...baseFilter };
    const tasks = await Task.find(taskFilter).populate('assigneeId', 'name').populate('projectId', 'title projectKey');
    tasks.forEach(task => {
       if (task.startDate || task.dueDate || task.createdAt) {
          const startDate = task.startDate || task.createdAt || task.dueDate;
          const prefix = task.projectId ? `[${task.projectId.projectKey || task.projectId.title}] ` : '';
          events.push({
             id: `task-${task._id}`,
             title: `${prefix}${task.title}`,
             start: startDate,
             end: task.dueDate || startDate,
             type: 'TASK',
             color: '#3b82f6', // blue-500
             responsible: task.assigneeId ? task.assigneeId.name : 'Unassigned',
             details: task
          });
       }
    });

    // 1.5 Fetch Features (Teal)
    const featureFilter = { ...baseFilter };
    const features = await Feature.find(featureFilter).populate('createdBy', 'name').populate('projectId', 'title projectKey');
    features.forEach(feature => {
       if (feature.startDate || feature.targetEndDate) {
          const prefix = feature.projectId ? `[${feature.projectId.projectKey || feature.projectId.title}] ` : '';
          events.push({
             id: `feature-${feature._id}`,
             title: `${prefix}${feature.title}`,
             start: feature.startDate || feature.targetEndDate,
             end: feature.targetEndDate || feature.startDate,
             type: 'FEATURE',
             color: '#0d9488', // teal-600
             responsible: feature.createdBy ? feature.createdBy.name : 'Team',
             details: feature
          });
       }
    });
    // Removed duplicate task block.

    // 2. Fetch Bugs (Red)
    const bugFilter = { ...baseFilter };
    const bugs = await Bug.find(bugFilter).populate('assigneeId', 'name').populate('projectId', 'title projectKey');
    bugs.forEach(bug => {
       if (bug.createdAt) { // Or due date if bugs have them
          const prefix = bug.projectId ? `[${bug.projectId.projectKey || bug.projectId.title}] ` : '';
          events.push({
             id: `bug-${bug._id}`,
             title: `${prefix}${bug.title}`,
             start: bug.createdAt, // fallback to created date
             end: bug.createdAt,
             type: 'BUG',
             color: '#ef4444', // red-500
             responsible: bug.assigneeId ? bug.assigneeId.name : 'Unassigned',
             details: bug
          });
       }
    });

    // 3. Fetch Milestones (Amber)
    const milestoneFilter = { ...baseFilter };
    const milestones = await Milestone.find(milestoneFilter).populate('projectId', 'title projectKey');
    milestones.forEach(milestone => {
       if (milestone.deadline) {
          const prefix = milestone.projectId ? `[${milestone.projectId.projectKey || milestone.projectId.title}] ` : '';
          events.push({
             id: `milestone-${milestone._id}`,
             title: `${prefix}${milestone.title}`,
             start: milestone.deadline,
             end: milestone.deadline,
             type: 'MILESTONE',
             color: '#f59e0b', // amber-500
             responsible: 'Group',
             details: milestone
          });
       }
    });

    // 4. Fetch Reviews (Purple)
    // Reviews are global or assigned to specific groups
    const reviewFilter = {};
    if (req.user.role === 'FACULTY') {
       reviewFilter.facultyReviewers = req.user._id;
    }
    const reviews = await Review.find(reviewFilter).populate('facultyReviewers', 'name');
    reviews.forEach(review => {
       if (review.reviewDate) {
          // Calculate precise start and end Date objects based on startTime and endTime strings if needed
          events.push({
             id: `review-${review._id}`,
             title: review.title,
             start: review.reviewDate,
             end: review.reviewDate,
             type: 'REVIEW',
             color: '#8b5cf6', // purple-500
             responsible: review.facultyReviewers.length > 0 ? review.facultyReviewers.map(f => f.name).join(', ') : 'Unassigned',
             details: review
          });
       }
    });

    // 5. Fetch Releases (Emerald)
    const releaseFilter = { ...baseFilter, status: { $ne: 'DRAFT' } };
    const releases = await Release.find(releaseFilter).populate('projectId', 'title projectKey');
    releases.forEach(release => {
       if (release.releaseDate) {
          const prefix = release.projectId ? `[${release.projectId.projectKey || release.projectId.title}] ` : '';
          events.push({
             id: `release-${release._id}`,
             title: `${prefix}${release.version} - ${release.title}`,
             start: release.releaseDate,
             end: release.releaseDate,
             type: 'RELEASE',
             color: '#10b981', // emerald-500
             responsible: 'Team',
             details: release
          });
       }
    });

    res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};
