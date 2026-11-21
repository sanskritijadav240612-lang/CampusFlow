import { z } from 'zod';

export const facultyRequestsQuerySchema = z.object({
  status: z.enum(['Under Review', 'Approved', 'Rejected', 'all']).optional().default('Under Review'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().trim().optional(),
});

export const decisionRemarkSchema = z
  .object({
    decisionRemark: z
      .string()
      .trim()
      .max(1000, 'Decision remark cannot exceed 1000 characters')
      .optional()
      .default(''),
  })
  .strict({
    message: 'Unexpected field in decision payload',
  });

export const notificationQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'sent', 'failed', 'all']).optional(),
  type: z.enum(['request_approved', 'request_rejected', 'all']).optional(),
  eventRequestId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
