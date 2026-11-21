import { z } from 'zod';

export const createResourceSchema = z
  .object({
    name: z
      .string({ required_error: 'Resource name is required' })
      .trim()
      .min(2, 'Resource name must be at least 2 characters long')
      .max(100, 'Resource name cannot exceed 100 characters'),
    category: z
      .string({ required_error: 'Category is required' })
      .trim()
      .min(2, 'Category must be at least 2 characters long')
      .max(50, 'Category cannot exceed 50 characters'),
    resourceMode: z.enum(['capacity', 'quantity'], {
      required_error: 'Resource mode must be either capacity or quantity',
    }),
    capacity: z
      .number()
      .int('Capacity must be an integer')
      .positive('Capacity must be a positive integer')
      .optional(),
    totalQuantity: z
      .number()
      .int('Total quantity must be an integer')
      .positive('Total quantity must be a positive integer')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .default(''),
    location: z
      .string()
      .trim()
      .max(200, 'Location cannot exceed 200 characters')
      .optional()
      .default(''),
  })
  .strict({
    message: 'Unexpected field in create resource payload',
  })
  .refine(
    (data) => {
      if (data.resourceMode === 'capacity') {
        return data.capacity !== undefined && data.capacity > 0 && data.totalQuantity === undefined;
      }
      return data.totalQuantity !== undefined && data.totalQuantity > 0 && data.capacity === undefined;
    },
    {
      message:
        'Capacity is required for capacity-based resources and totalQuantity must not be provided; totalQuantity is required for quantity-based resources and capacity must not be provided.',
      path: ['resourceMode'],
    }
  );

export const resourceQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  resourceMode: z.enum(['capacity', 'quantity']).optional(),
  isActive: z.enum(['true', 'false', 'all']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
