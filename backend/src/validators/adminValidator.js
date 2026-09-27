import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters'),
  code: z.string().trim().min(2, 'Department code must be at least 2 characters').toUpperCase(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createAcademicYearSchema = z.object({
  yearLabel: z.string().trim().min(4, 'Year label required (e.g. 2025-2026)'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().optional(),
});

export const createSgpCycleSchema = z.object({
  name: z.string().trim().min(3, 'Cycle name required'),
  departmentId: z.string().min(1, 'Department is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().optional(),
});

export const createUserAccountSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'FACULTY', 'STUDENT']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  enrollmentNumber: z.string().trim().optional().or(z.literal('')),
  departmentId: z.string().optional().nullable(),
  semester: z.number().int().min(1).max(10).optional(),
  designation: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

export const updateUserAccountSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  departmentId: z.string().optional().nullable(),
  semester: z.number().int().optional(),
  designation: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
