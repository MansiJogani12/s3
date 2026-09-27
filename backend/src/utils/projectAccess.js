import GroupMember from '../models/GroupMember.js';
import Project from '../models/Project.js';
import ProjectGroup from '../models/ProjectGroup.js';

export const resolveAndVerifyProjectId = async (req) => {
  const requestedProjectId = req.query.projectId || req.body.projectId;
  const user = req.user;

  // For Admin and Coordinator, they must explicitly provide a projectId. If they do, they have access.
  if (['ADMIN', 'COORDINATOR'].includes(user.role)) {
    return requestedProjectId || null;
  }

  // For Students, they ONLY get their own project. If they request a different one, return null.
  if (user.role === 'STUDENT') {
    const membership = await GroupMember.findOne({
      userId: user._id,
      status: 'ACCEPTED',
    });
    if (!membership) return null;

    const project = await Project.findOne({ groupId: membership.groupId });
    if (!project) return null;
    
    if (requestedProjectId && String(requestedProjectId) !== String(project._id)) {
      return null;
    }
    return project._id;
  }

  // For Faculty (Guide / CC Faculty), they must request a specific projectId and we verify their assignment.
  if (['FACULTY'].includes(user.role)) {
    if (!requestedProjectId) return null;

    const project = await Project.findById(requestedProjectId);
    if (!project) return null;

    // Check if faculty is guide or co-guide of the group
    const group = await ProjectGroup.findOne({
      _id: project.groupId,
      $or: [
        { guideId: user._id },
        { coGuideId: user._id }
      ]
    });
    
    // Also check backward compatibility: faculty is legacy facultyGuideId on the project
    const isLegacyGuide = String(project.facultyGuideId) === String(user._id);

    if (!group && !isLegacyGuide) return null;
    return project._id;
  }

  return null;
};
