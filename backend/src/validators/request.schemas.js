import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

const requestedResourceItemSchema = z.object({
  resourceId: objectIdSchema,
  requestedQuantity: z.number().int().positive().optional(),
});

export const checkAvailabilitySchema = z
  .object({
    startAt: z
      .string({ required_error: 'startAt is required' })
      .datetime({ offset: true, message: 'startAt must be a valid ISO 8601 date string' }),
    endAt: z
      .string({ required_error: 'endAt is required' })
      .datetime({ offset: true, message: 'endAt must be a valid ISO 8601 date string' }),
    attendeeCount: z
      .number({ required_error: 'attendeeCount is required' })
      .int('attendeeCount must be an integer')
      .positive('attendeeCount must be a positive integer'),
    requestedResources: z
      .array(requestedResourceItemSchema)
      .min(1, 'At least one requested resource is required'),
  })
  .strict({
    message: 'Unexpected field in availability check payload',
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'endAt must be later than startAt',
    path: ['endAt'],
  });

export const createEventRequestSchema = z
  .object({
    title: z
      .string({ required_error: 'title is required' })
      .trim()
      .min(2, 'Event title must be at least 2 characters long')
      .max(150, 'Event title cannot exceed 150 characters'),
    description: z
      .string({ required_error: 'description is required' })
      .trim()
      .min(5, 'Event description must be at least 5 characters long')
      .max(2000, 'Event description cannot exceed 2000 characters'),
    eventType: z.string().trim().max(50).optional().default(''),
    startAt: z
      .string({ required_error: 'startAt is required' })
      .datetime({ offset: true, message: 'startAt must be a valid ISO 8601 date string' }),
    endAt: z
      .string({ required_error: 'endAt is required' })
      .datetime({ offset: true, message: 'endAt must be a valid ISO 8601 date string' }),
    attendeeCount: z
      .number({ required_error: 'attendeeCount is required' })
      .int('attendeeCount must be an integer')
      .positive('attendeeCount must be a positive integer'),
    requestedResources: z
      .array(requestedResourceItemSchema)
      .min(1, 'At least one requested resource is required'),
    conversationId: objectIdSchema.optional(),
  })
  .strict({
    message: 'Unexpected field in create event request payload',
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'endAt must be later than startAt',
    path: ['endAt'],
  });

export const myRequestsQuerySchema = z.object({
  status: z.enum(['Under Review', 'Approved', 'Rejected']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
