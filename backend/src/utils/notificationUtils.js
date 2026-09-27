import Notification from '../models/Notification.js';
import GroupMember from '../models/GroupMember.js';
import Project from '../models/Project.js';

/**
 * Creates a notification for all members of a project group, except the initiator.
 * @param {string} projectId - The ID of the project.
 * @param {object} initiator - The user object making the change.
 * @param {string} type - 'TASK', 'BUG', 'FEATURE', 'MILESTONE', 'RELEASE', 'FILE', etc.
 * @param {string} title - The title of the notification.
 * @param {string} message - The main content of the notification.
 */
export const notifyProjectMembers = async (projectId, initiator, type, title, message) => {
  try {
    if (!projectId) return;

    const project = await Project.findById(projectId);
    if (!project) return;

    // Find all group members
    const members = await GroupMember.find({ groupId: project.groupId, status: 'ACCEPTED' });

    // Find assigned faculty (Guide, Co-guide)
    const { default: ProjectGroup } = await import('../models/ProjectGroup.js');
    const group = await ProjectGroup.findById(project.groupId);
    
    const notifyUserIds = members.map(m => m.userId.toString());
    if (group && group.guideId) notifyUserIds.push(group.guideId.toString());
    if (group && group.coGuideId) notifyUserIds.push(group.coGuideId.toString());

    const notifications = [];
    // Deduplicate user IDs using Set
    const uniqueNotifyIds = [...new Set(notifyUserIds)];
    
    uniqueNotifyIds.forEach((userIdStr) => {
      // Don't notify the person who made the change
      if (userIdStr !== initiator._id.toString()) {
        notifications.push({
          userId: userIdStr,
          title,
          message,
          type: type
        });
      }
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error generating project notifications:', error);
  }
};
