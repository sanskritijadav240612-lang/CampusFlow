import { z } from 'zod';

export const postMessageSchema = z
  .object({
    content: z
      .string({ required_error: 'Message content is required' })
      .trim()
      .min(1, 'Message content cannot be empty')
      .max(5000, 'Message content cannot exceed 5000 characters'),
  })
  .strict({
    message: 'Unexpected field in message payload',
  });

export const aiResourceMentionSchema = z.object({
  name: z.string().trim().min(1, 'Resource name mention cannot be empty'),
  requestedQuantity: z.number().int().positive().nullable().optional(),
});

export const aiEventDraftSchema = z.object({
  title: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  eventType: z.string().trim().nullable().optional(),
  startAt: z.string().trim().nullable().optional(),
  endAt: z.string().trim().nullable().optional(),
  attendeeCount: z.number().int().positive().nullable().optional(),
  resourceMentions: z.array(aiResourceMentionSchema).default([]),
});

export const aiResponseSchema = z.object({
  assistantMessage: z.string().trim().min(1, 'Assistant message cannot be empty'),
  eventDraft: aiEventDraftSchema,
});
