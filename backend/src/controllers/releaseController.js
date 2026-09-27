import Release from '../models/Release.js';
import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';
import { notifyProjectMembers } from '../utils/notificationUtils.js';

// ================= COORDINATOR/FACULTY/STUDENT: MANAGE RELEASES =================

export const createRelease = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Project ID required' });

    const { version, title, description, releaseDate, milestoneId, includedFeatures, status, githubReleaseUrl } = req.body;

    const release = await Release.create({
      projectId,
      version,
      title,
      description,
      releaseDate,
      milestoneId,
      includedFeatures: includedFeatures || [],
      status: status || 'DRAFT',
      githubReleaseUrl: githubReleaseUrl || ''
    });
    await notifyProjectMembers(projectId, req.user, 'RELEASE', 'New Release Scheduled', `${req.user.name} created a new release: ${version} - ${title}`);

    res.status(201).json({ success: true, release });
  } catch (error) {
    next(error);
  }
};

export const getReleasesByProject = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, releases: [] });

    const releases = await Release.find({ projectId })
      .populate('milestoneId', 'title')
      .populate('includedFeatures', 'title status')
      .sort({ releaseDate: -1 });

    res.status(200).json({ success: true, releases });
  } catch (error) {
    next(error);
  }
};

export const updateRelease = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldRelease = await Release.findById(id);
    const release = await Release.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!release) return res.status(404).json({ success: false, message: 'Release not found' });
    
    const projectId = await resolveAndVerifyProjectId(req);
    
    // If status changed to RELEASED, trigger a notification
    if (req.body.status === 'RELEASED' && oldRelease?.status !== 'RELEASED') {
        await notifyProjectMembers(projectId, req.user, 'RELEASE', 'Release Deployed', `Release ${release.version} (${release.title}) has been officially released!`);
    } else {
        await notifyProjectMembers(projectId, req.user, 'RELEASE', 'Release Updated', `${req.user.name} updated the release: ${release.version}`);
    }
    
    res.status(200).json({ success: true, release });
  } catch (error) {
    next(error);
  }
};

export const deleteRelease = async (req, res, next) => {
  try {
    const { id } = req.params;
    const release = await Release.findByIdAndDelete(id);
    if (release) {
       const projectId = await resolveAndVerifyProjectId(req);
       await notifyProjectMembers(projectId, req.user, 'RELEASE', 'Release Deleted', `${req.user.name} deleted the release: ${release.version}`);
    }
    res.status(200).json({ success: true, message: 'Release deleted successfully' });
  } catch (error) {
    next(error);
  }
};
