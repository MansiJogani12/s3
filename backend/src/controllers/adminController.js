import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import Department from '../models/Department.js';
import AcademicYear from '../models/AcademicYear.js';
import SGPCycle from '../models/SGPCycle.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import {
  createUserAccountSchema,
  updateUserAccountSchema,
  resetPasswordSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createAcademicYearSchema,
  createSgpCycleSchema,
} from '../validators/adminValidator.js';

// ==================== USER MANAGEMENT ====================

export const getUsers = async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status !== undefined) query.isActive = status === 'true';

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { enrollmentNumber: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    // Populate profiles
    const usersWithProfiles = await Promise.all(
      users.map(async (u) => {
        const uObj = u.toJSON();
        let profile = null;
        if (u.role === 'STUDENT') {
          profile = await StudentProfile.findOne({ userId: u._id }).populate('departmentId', 'name code');
        } else if (u.role === 'FACULTY' || u.role === 'COORDINATOR') {
          profile = await FacultyProfile.findOne({ userId: u._id }).populate('departmentId', 'name code');
        }
        return { ...uObj, profile };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithProfiles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const validated = createUserAccountSchema.parse(req.body);
    const {
      name,
      role,
      password,
      email,
      enrollmentNumber,
      departmentId,
      semester,
      designation,
      expertise,
      skills,
      interests,
      bio,
    } = validated;

    if (role === 'STUDENT') {
      if (!enrollmentNumber) {
        return res.status(400).json({
          success: false,
          message: 'Enrollment number is required for student accounts.',
        });
      }
      const existingStudent = await User.findOne({
        enrollmentNumber: enrollmentNumber.toUpperCase(),
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: `Student with enrollment number '${enrollmentNumber}' already exists.`,
        });
      }
    } else {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required for non-student accounts.',
        });
      }
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `User with email '${email}' already exists.`,
        });
      }
    }

    const newUser = await User.create({
      name,
      role,
      passwordHash: password,
      email: email ? email.toLowerCase() : undefined,
      enrollmentNumber: enrollmentNumber ? enrollmentNumber.toUpperCase() : undefined,
      isActive: true,
    });

    let profile = null;
    if (role === 'STUDENT') {
      profile = await StudentProfile.create({
        userId: newUser._id,
        enrollmentNumber: newUser.enrollmentNumber,
        departmentId: departmentId || null,
        semester: semester || 1,
        skills: skills || [],
        interests: interests || [],
        bio: bio || '',
      });
    } else if (role === 'FACULTY' || role === 'COORDINATOR') {
      profile = await FacultyProfile.create({
        userId: newUser._id,
        departmentId: departmentId || null,
        designation: designation || 'Assistant Professor',
        expertise: expertise || [],
      });
    }

    await logAuditEvent({
      actor: req.user,
      action: 'USER_CREATED',
      targetEntity: 'User',
      targetId: newUser._id,
      details: { role: newUser.role, name: newUser.name },
      req,
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user: {
        ...newUser.toJSON(),
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateUserAccountSchema.parse(req.body);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (validated.name) user.name = validated.name;
    if (validated.email && user.role !== 'STUDENT') user.email = validated.email.toLowerCase();
    await user.save();

    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          ...(validated.departmentId !== undefined && { departmentId: validated.departmentId }),
          ...(validated.semester !== undefined && { semester: validated.semester }),
        },
        { new: true }
      );
    } else if (user.role === 'FACULTY' || user.role === 'COORDINATOR') {
      profile = await FacultyProfile.findOneAndUpdate(
        { userId: user._id },
        {
          ...(validated.departmentId !== undefined && { departmentId: validated.departmentId }),
          ...(validated.designation && { designation: validated.designation }),
          ...(validated.expertise && { expertise: validated.expertise }),
        },
        { new: true }
      );
    }

    await logAuditEvent({
      actor: req.user,
      action: 'USER_UPDATED',
      targetEntity: 'User',
      targetId: user._id,
      details: { role: user.role },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: { ...user.toJSON(), profile },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAuditEvent({
      actor: req.user,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetEntity: 'User',
      targetId: user._id,
      details: { newStatus: user.isActive },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = newPassword;
    await user.save();

    await logAuditEvent({
      actor: req.user,
      action: 'USER_PASSWORD_RESET',
      targetEntity: 'User',
      targetId: user._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DEPARTMENT MANAGEMENT ====================

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const validated = createDepartmentSchema.parse(req.body);
    const department = await Department.create(validated);

    await logAuditEvent({
      actor: req.user,
      action: 'DEPARTMENT_CREATED',
      targetEntity: 'Department',
      targetId: department._id,
      details: { code: department.code },
      req,
    });

    res.status(201).json({ success: true, message: 'Department created.', department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateDepartmentSchema.parse(req.body);
    const department = await Department.findByIdAndUpdate(id, validated, { new: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, message: 'Department updated.', department });
  } catch (error) {
    next(error);
  }
};

// ==================== ACADEMIC YEAR MANAGEMENT ====================

export const getAcademicYears = async (req, res, next) => {
  try {
    const academicYears = await AcademicYear.find().sort({ yearLabel: -1 });
    res.status(200).json({ success: true, academicYears });
  } catch (error) {
    next(error);
  }
};

export const createAcademicYear = async (req, res, next) => {
  try {
    const validated = createAcademicYearSchema.parse(req.body);
    const academicYear = await AcademicYear.create(validated);

    await logAuditEvent({
      actor: req.user,
      action: 'ACADEMIC_YEAR_CREATED',
      targetEntity: 'AcademicYear',
      targetId: academicYear._id,
      details: { yearLabel: academicYear.yearLabel },
      req,
    });

    res.status(201).json({ success: true, message: 'Academic Year created.', academicYear });
  } catch (error) {
    next(error);
  }
};

export const updateAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const academicYear = await AcademicYear.findByIdAndUpdate(id, req.body, { new: true });
    if (!academicYear) {
      return res.status(404).json({ success: false, message: 'Academic Year not found' });
    }
    res.status(200).json({ success: true, message: 'Academic Year updated.', academicYear });
  } catch (error) {
    next(error);
  }
};

// ==================== SGP CYCLE MANAGEMENT ====================

export const getSgpCycles = async (req, res, next) => {
  try {
    const sgpCycles = await SGPCycle.find()
      .populate('departmentId', 'name code')
      .populate('academicYearId', 'yearLabel')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, sgpCycles });
  } catch (error) {
    next(error);
  }
};

export const createSgpCycle = async (req, res, next) => {
  try {
    const validated = createSgpCycleSchema.parse(req.body);
    const sgpCycle = await SGPCycle.create(validated);

    await logAuditEvent({
      actor: req.user,
      action: 'SGP_CYCLE_CREATED',
      targetEntity: 'SGPCycle',
      targetId: sgpCycle._id,
      details: { name: sgpCycle.name },
      req,
    });

    res.status(201).json({ success: true, message: 'SGP Cycle created.', sgpCycle });
  } catch (error) {
    next(error);
  }
};

export const updateSgpCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sgpCycle = await SGPCycle.findByIdAndUpdate(id, req.body, { new: true });
    if (!sgpCycle) {
      return res.status(404).json({ success: false, message: 'SGP Cycle not found' });
    }
    res.status(200).json({ success: true, message: 'SGP Cycle updated.', sgpCycle });
  } catch (error) {
    next(error);
  }
};
