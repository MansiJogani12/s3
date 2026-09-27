import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import { loginSchema } from '../validators/authValidator.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Helper to sign JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      enrollmentNumber: user.enrollmentNumber || null,
    },
    process.env.JWT_SECRET || 'teamsync_fallback_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { loginId, password } = validatedData;

    const trimmedIdentifier = loginId.trim();

    // Query by enrollmentNumber OR email
    const user = await User.findOne({
      $or: [
        { enrollmentNumber: trimmedIdentifier.toUpperCase() },
        { email: trimmedIdentifier.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid enrollment number/email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid enrollment number/email or password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT
    const token = generateToken(user);

    // Load associated profile
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'FACULTY' || user.role === 'COORDINATOR') {
      profile = await FacultyProfile.findOne({ userId: user._id });
    }

    // Audit log
    await logAuditEvent({
      actor: user,
      action: 'USER_LOGIN',
      targetEntity: 'User',
      targetId: user._id,
      details: { role: user.role },
      req,
    });

    const userObj = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...userObj,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'FACULTY' || user.role === 'COORDINATOR') {
      profile = await FacultyProfile.findOne({ userId: user._id });
    }

    const userObj = user.toJSON();

    return res.status(200).json({
      success: true,
      user: {
        ...userObj,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditEvent({
        actor: req.user,
        action: 'USER_LOGOUT',
        targetEntity: 'User',
        targetId: req.user._id,
        req,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
