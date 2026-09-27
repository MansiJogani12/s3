import { z } from 'zod';

export const loginSchema = z.object({
  loginId: z.string().trim().min(1, 'Enrollment number or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  enrollmentNumber: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'FACULTY', 'STUDENT']),
  departmentId: z.string().optional(),
  semester: z.number().int().min(1).max(10).optional(),
  designation: z.string().optional(),
});
