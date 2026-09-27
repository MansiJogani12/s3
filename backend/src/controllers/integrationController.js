import GithubIntegration from '../models/GithubIntegration.js';
import Release from '../models/Release.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import Project from '../models/Project.js';
import GroupMember from '../models/GroupMember.js';
import Notification from '../models/Notification.js';
import { notifyProjectMembers } from '../utils/notificationUtils.js';

import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';

// ================= GITHUB INTEGRATION (FR-1201 & FR-1202) =================
export const getGithubConfig = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, integration: null });

    let integration = await GithubIntegration.findOne({ projectId });
    if (!integration) {
      const project = await Project.findById(projectId);
      const repoName = project?.projectKey ? `teamsync-${project.projectKey.toLowerCase()}-portal` : 'teamsync-student-project';
      integration = await GithubIntegration.create({
        projectId,
        repoUrl: `https://github.com/teamsync-org/${repoName}`,
        repoName,
        isConnected: true,
      });
    }

    res.status(200).json({ success: true, integration });
  } catch (error) {
    next(error);
  }
};

export const connectGithubRepo = async (req, res, next) => {
  try {
    const user = req.user;
    const { repoUrl, action, projectId: bodyProjectId } = req.body;
    
    let projectId;
    if (user.role === 'STUDENT') {
      projectId = await resolveAndVerifyProjectId(req);
    } else {
      projectId = bodyProjectId;
    }
    
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });
    
    const existingIntegration = await GithubIntegration.findOne({ projectId });

    if (existingIntegration && existingIntegration.isConnected && user.role === 'STUDENT') {
      const project = await Project.findById(projectId);
      if (project.facultyGuideId) {
        await Notification.create({
          userId: project.facultyGuideId,
          title: 'GitHub Repo Change Request',
          message: action === 'disconnect' 
            ? `Group ${project.projectKey} wants to disconnect their GitHub repository.` 
            : `Group ${project.projectKey} wants to change their GitHub repo to ${repoUrl}.`,
          type: 'WARNING',
          linkUrl: `/faculty/group/${project.groupId}`,
          actionType: 'GITHUB_REPO_CHANGE',
          actionPayload: { projectId, groupId: project.groupId, repoUrl, action }
        });
        return res.status(200).json({ success: true, requestSent: true, message: 'Change request sent to your faculty guide.' });
      } else {
        return res.status(400).json({ success: false, message: 'Cannot change repo directly. You have no faculty guide assigned to send the request to.' });
      }
    }

    if (action === 'disconnect') {
      await GithubIntegration.findOneAndUpdate({ projectId }, { repoUrl: '', repoName: '', isConnected: false });
      return res.status(200).json({ success: true, message: 'Repository disconnected.' });
    }

    if (!repoUrl) return res.status(400).json({ success: false, message: 'Repository URL is required.' });

    const repoName = repoUrl.split('/').pop().replace('.git', '');

    const integration = await GithubIntegration.findOneAndUpdate(
      { projectId },
      { repoUrl, repoName, isConnected: true, lastSyncedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, integration });
  } catch (error) {
    next(error);
  }
};

export const getGithubCommits = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, commits: [] });

    const project = await Project.findById(projectId);
    const key = project?.projectKey || 'ASCGS';

    // Generated commit history with task references
    const commits = [
      {
        hash: '7f9a2bc',
        author: 'Rahul Sharma',
        message: `feat(${key}-001): implement mobile web camera QR scanner modal`,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        branch: 'main',
      },
      {
        hash: 'a1e84df',
        author: 'Priya Patel',
        message: `fix(${key}-BUG-001): request camera permission explicitly on iOS Safari`,
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        branch: 'fix/ios-camera-perm',
      },
      {
        hash: 'c83d91e',
        author: 'Amit Kumar',
        message: `docs(${key}): update SRS requirement specs for 2048-bit RSA encryption`,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        branch: 'main',
      },
      {
        hash: 'e410a5b',
        author: 'Rahul Sharma',
        message: `chore: setup initial Vite React frontend and Express MongoDB API`,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        branch: 'main',
      },
    ];

    res.status(200).json({ success: true, commits });
  } catch (error) {
    next(error);
  }
};

export const getGithubPullRequests = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, pullRequests: [] });

    const project = await Project.findById(projectId);
    const key = project?.projectKey || 'ASCGS';

    const pullRequests = [
      {
        id: 1,
        title: `PR #1: Implement QR Scanner Modal (${key}-001)`,
        author: 'Rahul Sharma',
        status: 'MERGED',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        additions: 142,
        deletions: 12,
      },
      {
        id: 2,
        title: `PR #2: Fix iOS Safari Camera Permissions (${key}-BUG-001)`,
        author: 'Priya Patel',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        additions: 24,
        deletions: 5,
      },
    ];

    res.status(200).json({ success: true, pullRequests });
  } catch (error) {
    next(error);
  }
};

// ================= RELEASES (FR-1203) =================
export const getReleases = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, releases: [] });

    let releases = await Release.find({ projectId }).sort({ releasedAt: -1 });

    if (releases.length === 0) {
      releases = [
        await Release.create({
          projectId,
          version: 'v1.0.0-alpha',
          title: 'Sprint 1 MVP Build - Smart Campus Gatepass',
          releaseNotes: 'Initial release featuring QR code generation, mobile scanner integration, and task tracking.',
          tag: 'v1.0.0-alpha',
          status: 'RELEASED',
        }),
      ];
    }

    res.status(200).json({ success: true, releases });
  } catch (error) {
    next(error);
  }
};

export const createRelease = async (req, res, next) => {
  try {
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const { version, title, releaseNotes, tag, artifactUrl } = req.body;
    const release = await Release.create({
      projectId,
      version,
      title,
      releaseNotes,
      tag: tag || version,
      artifactUrl: artifactUrl || '',
      status: 'RELEASED',
    });

    await notifyProjectMembers(projectId, req.user, 'RELEASE', 'New Release Created', `${req.user.name} created release ${release.version}`);

    res.status(201).json({ success: true, release });
  } catch (error) {
    next(error);
  }
};

export const updateRelease = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const release = await Release.findOneAndUpdate(
      { _id: id, projectId },
      { $set: req.body },
      { new: true }
    );

    if (!release) return res.status(404).json({ success: false, message: 'Release not found or unauthorized.' });

    await notifyProjectMembers(projectId, req.user, 'RELEASE', 'Release Updated', `${req.user.name} updated release ${release.version}`);

    res.status(200).json({ success: true, release });
  } catch (error) {
    next(error);
  }
};

export const deleteRelease = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const release = await Release.findOneAndDelete({ _id: id, projectId });
    if (!release) return res.status(404).json({ success: false, message: 'Release not found or unauthorized.' });

    await notifyProjectMembers(projectId, req.user, 'RELEASE', 'Release Deleted', `${req.user.name} deleted release ${release.version}`);

    res.status(200).json({ success: true, message: 'Release deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ================= UNIFIED PROJECT CALENDAR (FR-1204) =================
export const getCalendarEvents = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, events: [] });

    const milestones = await Milestone.find({ projectId });
    const tasks = await Task.find({ projectId, dueDate: { $ne: null } });
    const sprints = await Sprint.find({ projectId });

    const events = [];

    milestones.forEach((m) => {
      events.push({
        id: `milestone-${m._id}`,
        title: `[Milestone] ${m.title}`,
        date: m.deadline,
        type: 'MILESTONE',
        color: '#8b5cf6',
      });
    });

    tasks.forEach((t) => {
      events.push({
        id: `task-${t._id}`,
        title: `[Task Due] ${t.taskKey}: ${t.title}`,
        date: t.dueDate,
        type: 'TASK',
        color: '#3b82f6',
      });
    });

    sprints.forEach((s) => {
      events.push({
        id: `sprint-end-${s._id}`,
        title: `[Sprint Deadline] ${s.name}`,
        date: s.endDate,
        type: 'SPRINT',
        color: '#10b981',
      });
    });

    res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};
