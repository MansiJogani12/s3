import Milestone from '../models/Milestone.js';
import WikiPage from '../models/WikiPage.js';
import ChatMessage from '../models/ChatMessage.js';
import ProjectFile from '../models/ProjectFile.js';
import Project from '../models/Project.js';
import GroupMember from '../models/GroupMember.js';
import { logAuditEvent } from '../utils/auditLogger.js';

import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';

// ================= MILESTONES (FR-1001 & FR-1002) =================
export const getMilestones = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, milestones: [] });

    let milestones = await Milestone.find({ projectId }).sort({ targetDate: 1 });

    if (milestones.length === 0) {
      // Seed default milestone template
      const defaultTemplates = [
        { 
          title: 'Milestone 1: Proposal Submission & Approval', 
          targetDate: new Date(Date.now() + 7 * 86400000), 
          startDate: new Date(Date.now()), 
          progressPercentage: 100, 
          status: 'COMPLETED',
          type: 'OFFICIAL',
          expectedProgress: 100,
          requirements: [
            { text: 'Finalize Project Topic', isCompleted: true },
            { text: 'Form Project Group', isCompleted: true },
            { text: 'Prepare Project Proposal', isCompleted: true },
            { text: 'Submit Proposal', isCompleted: true }
          ]
        },
        { 
          title: 'Milestone 2: SRS Requirements & Architecture Design', 
          targetDate: new Date(Date.now() + 21 * 86400000), 
          startDate: new Date(Date.now() + 8 * 86400000), 
          progressPercentage: 50, 
          status: 'IN_PROGRESS',
          type: 'OFFICIAL',
          expectedProgress: 25,
          requirements: [
            { text: 'Complete SRS Document', isCompleted: true },
            { text: 'Create Use Case Diagram', isCompleted: true },
            { text: 'Create Database Design', isCompleted: false },
            { text: 'Complete System Architecture', isCompleted: false }
          ]
        },
        { 
          title: 'Milestone 3: Development & Mid-Term Review', 
          targetDate: new Date(Date.now() + 45 * 86400000), 
          startDate: new Date(Date.now() + 22 * 86400000), 
          progressPercentage: 0, 
          status: 'NOT_STARTED',
          type: 'OFFICIAL',
          expectedProgress: 50,
          requirements: [
            { text: 'Complete Core Features', isCompleted: false },
            { text: 'Complete User Interface', isCompleted: false },
            { text: 'Complete Backend Integration', isCompleted: false },
            { text: 'Prepare Mid-Term Presentation', isCompleted: false }
          ]
        },
        { 
          title: 'Milestone 4: Final Testing & Academic Report', 
          targetDate: new Date(Date.now() + 60 * 86400000), 
          startDate: new Date(Date.now() + 46 * 86400000), 
          progressPercentage: 0, 
          status: 'NOT_STARTED',
          type: 'OFFICIAL',
          expectedProgress: 100,
          requirements: [
            { text: 'Testing & QA', isCompleted: false },
            { text: 'Deployment', isCompleted: false },
            { text: 'Final Report Generation', isCompleted: false },
            { text: 'Final Presentation', isCompleted: false }
          ]
        },
      ];

      milestones = await Milestone.insertMany(defaultTemplates.map((t) => ({ ...t, projectId })));
    }

    res.status(200).json({ success: true, milestones });
  } catch (error) {
    next(error);
  }
};

export const createMilestone = async (req, res, next) => {
  try {
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const { title, description, startDate, targetDate, progressPercentage, status } = req.body;
    const milestone = await Milestone.create({
      projectId,
      title,
      description,
      startDate: startDate || null,
      targetDate: targetDate || null,
      progressPercentage: progressPercentage || 0,
      status: status || 'NOT_STARTED',
    });

    res.status(201).json({ success: true, milestone });
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const milestone = await Milestone.findOneAndUpdate(
      { _id: id, projectId },
      { $set: req.body },
      { new: true }
    );

    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found or unauthorized.' });

    res.status(200).json({ success: true, milestone });
  } catch (error) {
    next(error);
  }
};

export const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const milestone = await Milestone.findOneAndDelete({ _id: id, projectId });
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found or unauthorized.' });

    res.status(200).json({ success: true, message: 'Milestone deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ================= WIKI PAGES (FR-1101) =================
export const getWikiPages = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, wikiPages: [] });

    const wikiPages = await WikiPage.find({ projectId }).populate('authorId', 'name enrollmentNumber').sort({ updatedAt: -1 });
    res.status(200).json({ success: true, wikiPages });
  } catch (error) {
    next(error);
  }
};

export const saveWikiPage = async (req, res, next) => {
  try {
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const { title, content, category, attachmentUrl } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if updating existing by ID (which StudentWikiPage now passes)
    let page;
    if (req.body._id) {
      page = await WikiPage.findOne({ _id: req.body._id, projectId });
    }
    
    if (!page) {
       page = await WikiPage.findOne({ projectId, slug });
    }

    if (page) {
      page.title = title;
      page.content = content;
      page.category = category || 'Technical Documentation';
      page.attachmentUrl = attachmentUrl || '';
      // allow slug update if title changed? Let's just keep original slug to avoid breaking links.
      await page.save();
    } else {
      page = await WikiPage.create({
        projectId,
        title,
        slug,
        category: category || 'Technical Documentation',
        attachmentUrl: attachmentUrl || '',
        content,
        authorId: user._id,
      });
    }

    res.status(200).json({ success: true, wikiPage: page });
  } catch (error) {
    next(error);
  }
};

export const deleteWikiPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const page = await WikiPage.findOneAndDelete({ _id: id, projectId });
    if (!page) return res.status(404).json({ success: false, message: 'Wiki page not found or unauthorized.' });

    res.status(200).json({ success: true, message: 'Wiki page deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ================= TEAM CHAT (FR-1102) =================
export const getChatMessages = async (req, res, next) => {
  try {
    const user = req.user;
    const isStudent = user.role === 'STUDENT';
    const reqProjectId = req.query.projectId;
    
    let projectId = null;
    if (isStudent) {
      projectId = await resolveAndVerifyProjectId(req);
      if (reqProjectId && reqProjectId !== String(projectId)) {
        return res.status(403).json({ success: false, message: 'Access denied to this project chat.' });
      }
    } else {
      projectId = reqProjectId;
      if (!projectId) return res.status(400).json({ success: false, message: 'Project ID required.' });
      
      if (user.role === 'FACULTY') {
        const project = await Project.findById(projectId);
        if (!project || String(project.facultyGuideId) !== String(user._id)) {
           return res.status(403).json({ success: false, message: 'Access denied. Not assigned to this project.' });
        }
      }
    }

    if (!projectId) return res.status(200).json({ success: true, messages: [] });

    const channelType = req.query.channelType || 'GROUP';
    const receiverId = req.query.receiverId;

    let query = { projectId, channelType };

    if (channelType === 'PERSONAL') {
      if (!receiverId) return res.status(400).json({ success: false, message: 'Receiver ID required for personal chat.' });
      query.$or = [
        { senderId: user._id, receiverId: receiverId },
        { senderId: receiverId, receiverId: user._id }
      ];
    }

    const messages = await ChatMessage.find(query)
      .populate('senderId', 'name enrollmentNumber role')
      .populate('receiverId', 'name')
      .sort({ createdAt: 1 });

    // Mark as read
    await ChatMessage.updateMany(
      { ...query, senderId: { $ne: user._id }, readBy: { $ne: user._id } },
      { $addToSet: { readBy: user._id } }
    );

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const getChatUnreadCounts = async (req, res, next) => {
  try {
    const user = req.user;
    const isStudent = user.role === 'STUDENT';
    const reqProjectId = req.query.projectId;

    let projectId = null;
    if (isStudent) {
      projectId = await resolveAndVerifyProjectId(req);
    } else {
      projectId = reqProjectId;
    }

    if (!projectId) return res.status(200).json({ success: true, counts: {} });

    const unreadMessages = await ChatMessage.find({
      projectId,
      senderId: { $ne: user._id },
      readBy: { $ne: user._id },
      isDeleted: false
    });

    const counts = {
      GROUP: 0,
      FACULTY: 0,
      PERSONAL: {}
    };

    unreadMessages.forEach(msg => {
      if (msg.channelType === 'GROUP') counts.GROUP++;
      else if (msg.channelType === 'FACULTY') counts.FACULTY++;
      else if (msg.channelType === 'PERSONAL') {
        const sender = String(msg.senderId);
        counts.PERSONAL[sender] = (counts.PERSONAL[sender] || 0) + 1;
      }
    });

    res.status(200).json({ success: true, counts, total: unreadMessages.length });
  } catch (error) {
    next(error);
  }
};

export const sendChatMessage = async (req, res, next) => {
  try {
    const user = req.user;
    const isStudent = user.role === 'STUDENT';
    const reqProjectId = req.body.projectId;
    
    let projectId = null;
    if (isStudent) {
      projectId = await resolveAndVerifyProjectId(req);
      if (reqProjectId && reqProjectId !== String(projectId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else {
      projectId = reqProjectId;
      if (!projectId) return res.status(400).json({ success: false, message: 'Project ID required.' });
    }

    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const { content, channelType, receiverId, attachmentUrl, replyToId } = req.body;
    if ((!content || !content.trim()) && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const message = await ChatMessage.create({
      projectId,
      channelType: channelType || 'GROUP',
      senderId: user._id,
      receiverId: channelType === 'PERSONAL' ? receiverId : null,
      content: content || '',
      attachmentUrl: attachmentUrl || '',
      replyToId: replyToId || null,
      readBy: [user._id],
    });

    const populatedMsg = await ChatMessage.findById(message._id)
      .populate('senderId', 'name enrollmentNumber role')
      .populate('receiverId', 'name')
      .populate('replyToId', 'content senderId');

    res.status(201).json({ success: true, message: populatedMsg });
  } catch (error) {
    next(error);
  }
};

export const updateChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Only sender can update
    const message = await ChatMessage.findOneAndUpdate(
      { _id: id, senderId: user._id, isDeleted: false },
      { content: req.body.content, isEdited: true },
      { new: true }
    ).populate('senderId', 'name enrollmentNumber role');

    if (!message) return res.status(404).json({ success: false, message: 'Message not found or unauthorized.' });

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const deleteChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Soft delete
    const message = await ChatMessage.findOneAndUpdate(
      { _id: id, senderId: user._id },
      { isDeleted: true, content: 'This message was deleted' },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found or unauthorized.' });

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// ================= FILES & DOCS (FR-1103 & FR-1104) =================
export const getFiles = async (req, res, next) => {
  try {
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(200).json({ success: true, files: [] });

    const files = await ProjectFile.find({ projectId }).populate('uploaderId', 'name enrollmentNumber').sort({ createdAt: -1 });
    res.status(200).json({ success: true, files });
  } catch (error) {
    next(error);
  }
};

export const uploadFileRecord = async (req, res, next) => {
  try {
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);
    if (!projectId) return res.status(400).json({ success: false, message: 'Active project required.' });

    const { name, fileUrl, category, size, mimeType } = req.body;
    const fileDoc = await ProjectFile.create({
      projectId,
      name,
      fileUrl: fileUrl || `https://teamsync.institution.edu/storage/${encodeURIComponent(name)}`,
      category: category || 'REPORT',
      size: size || 102400,
      mimeType: mimeType || 'application/pdf',
      uploaderId: user._id,
    });

    res.status(201).json({ success: true, file: fileDoc });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const fileDoc = await ProjectFile.findById(id).populate('projectId');
    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Security check: Verify user is student in group or assigned faculty guide
    if (user.role === 'STUDENT') {
      const studentProjectId = await resolveAndVerifyProjectId(req);
      if (String(studentProjectId) !== String(fileDoc.projectId._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to project document.' });
      }
    }

    res.status(200).json({
      success: true,
      downloadUrl: fileDoc.fileUrl,
      fileName: fileDoc.name,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const projectId = await resolveAndVerifyProjectId(req);

    const fileDoc = await ProjectFile.findOneAndDelete({ _id: id, projectId });
    if (!fileDoc) return res.status(404).json({ success: false, message: 'File not found or unauthorized.' });

    res.status(200).json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
