import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, 'Group name must be at least 3 characters'),
  sgpCycleId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  searchIdentifier: z.string().trim().min(1, 'Enrollment number or email required'),
});

export const respondInviteSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});
