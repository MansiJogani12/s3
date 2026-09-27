import Review from '../models/Review.js';
import ReviewMark from '../models/ReviewMark.js';
import Notification from '../models/Notification.js';
import ProjectGroup from '../models/ProjectGroup.js';
import GroupMember from '../models/GroupMember.js';
import Project from '../models/Project.js';

// ================= COORDINATOR: MANAGE REVIEWS =================

export const createReview = async (req, res, next) => {
  try {
    const { title, type, description, department, reviewDate, startTime, endTime, maxMarks, assignedGroups, facultyReviewers, status, marksVisibility } = req.body;

    const review = await Review.create({
      title,
      type,
      description,
      department,
      reviewDate,
      startTime,
      endTime,
      maxMarks,
      status: status || 'DRAFT',
      marksVisibility: marksVisibility || 'HIDDEN',
      assignedGroups: assignedGroups || [],
      facultyReviewers: facultyReviewers || []
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    // Coordinator can see all reviews
    const filter = {};
    if (req.user.role === 'COORDINATOR') {
       // Might filter by department if coordinator is department specific, but assuming global for now
       if (req.user.department) filter.department = req.user.department;
    }
    
    const reviews = await Review.find(filter)
       .populate('assignedGroups', 'title projectKey')
       .populate('facultyReviewers', 'name email')
       .sort({ reviewDate: 1 });
       
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    
    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    await ReviewMark.deleteMany({ reviewId: id });
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ================= FACULTY: CONDUCT REVIEWS =================

export const getAssignedReviews = async (req, res, next) => {
  try {
    // 1. Fetch all reviews created by Coordinator
    const reviews = await Review.find().sort({ reviewDate: 1 }).lean();

    // 2. Fetch groups using SAME logic as Faculty Dashboard
    const legacyProjects = await Project.find({ facultyGuideId: req.user._id }).lean();
    const legacyGroupIds = legacyProjects.map(p => p.groupId).filter(Boolean);

    let userGroups = await ProjectGroup.find({
      $or: [
        { guideId: req.user._id },
        { coGuideId: req.user._id },
        { _id: { $in: legacyGroupIds } }
      ]
    }).populate('leaderId', 'name enrollmentNumber email');

    if (userGroups.length === 0) {
      userGroups = await ProjectGroup.find().populate('leaderId', 'name enrollmentNumber email');
    }

    const groupIds = userGroups.map(g => g._id);

    // 3. Fetch student members
    const groupMemberships = await GroupMember.find({
      groupId: { $in: groupIds }
    }).populate('userId', 'name enrollmentNumber email');

    const groupMembersMap = {};
    groupMemberships.forEach(gm => {
      if (gm.groupId && gm.userId) {
        const gIdStr = gm.groupId.toString();
        if (!groupMembersMap[gIdStr]) groupMembersMap[gIdStr] = [];
        if (!groupMembersMap[gIdStr].some(m => m._id.toString() === gm.userId._id.toString())) {
          groupMembersMap[gIdStr].push({
            _id: gm.userId._id,
            name: gm.userId.name,
            enrollmentNumber: gm.userId.enrollmentNumber || '',
            role: gm.role || 'MEMBER'
          });
        }
      }
    });

    const enrichedGroups = userGroups.map(g => {
      const gIdStr = g._id.toString();
      let members = groupMembersMap[gIdStr] || [];
      
      if (g.leaderId && !members.some(m => m._id.toString() === g.leaderId._id.toString())) {
        members.unshift({
          _id: g.leaderId._id,
          name: g.leaderId.name,
          enrollmentNumber: g.leaderId.enrollmentNumber || '',
          role: 'LEADER'
        });
      }

      return {
        _id: g._id,
        id: g._id,
        name: g.name,
        code: g.code,
        title: g.name,
        leaderId: g.leaderId,
        members: members
      };
    });

    // 4. Map reviews with ALL faculty assigned groups
    const resultReviews = reviews.map(r => ({
      ...r,
      assignedGroups: enrichedGroups
    }));

    res.status(200).json({ success: true, reviews: resultReviews });
  } catch (error) {
    next(error);
  }
};

export const submitReviewMarks = async (req, res, next) => {
  try {
    const { id } = req.params; // review ID
    const { groupId, studentMarks, isDraft } = req.body; 
    // studentMarks: [{ studentId, marks, feedback }]

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Faculty can submit marks if they have assigned groups (no strict facultyReviewers check)

    const marksPromises = studentMarks.map(async (sm) => {
      // Validate max marks
      if (sm.marks > review.maxMarks || sm.marks < 0) {
         throw new Error(`Marks for student ${sm.studentId} exceed maximum allowed (${review.maxMarks}) or are invalid.`);
      }

      return ReviewMark.findOneAndUpdate(
        { reviewId: id, studentId: sm.studentId, facultyId: req.user._id },
        { 
          groupId,
          marks: sm.marks, 
          feedback: sm.feedback, 
          status: isDraft ? 'DRAFT' : 'SUBMITTED' 
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(marksPromises);

    if (!isDraft) {
       // Notify Coordinator (Assuming Admin/Coordinator logic)
       // Here we just insert a generic notification for simplicity
       // Notification logic will be expanded
    }

    res.status(200).json({ success: true, message: isDraft ? 'Draft saved' : 'Marks submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// ================= STUDENT: VIEW MARKS =================

export const getStudentMarks = async (req, res, next) => {
  try {
    // Only return marks if the Review's visibility is VISIBLE
    const marks = await ReviewMark.find({ studentId: req.user._id })
       .populate({
         path: 'reviewId',
         select: 'title type reviewDate marksVisibility status',
         match: { status: 'COMPLETED', marksVisibility: 'VISIBLE' } // Aggregation might be better if match fails
       })
       .populate('facultyId', 'name');

    // Filter out marks where reviewId is null (meaning the match condition failed because it was HIDDEN)
    const visibleMarks = marks.filter(m => m.reviewId !== null);

    res.status(200).json({ success: true, marks: visibleMarks });
  } catch (error) {
    next(error);
  }
};

export const getReviewDetailsForStudent = async (req, res, next) => {
  try {
    // Return the review schedules for the student's group, but hide marks if not visible
    // Wait, the student needs to know when reviews are.
    // They can see published reviews assigned to their group.
    
    // We would need the student's groupId. Assuming they pass it or we fetch it.
    const { groupId } = req.query;
    
    const reviews = await Review.find({ 
      assignedGroups: groupId,
      status: { $in: ['PUBLISHED', 'COMPLETED'] }
    }).select('-maxMarks -marksVisibility'); // Hide config fields
    
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};
