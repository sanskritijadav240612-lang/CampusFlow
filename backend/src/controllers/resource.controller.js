import * as resourceService from '../services/resource.service.js';
import { resourceQuerySchema } from '../validators/resource.schemas.js';

/**
 * Feature 22: List Campus Resource Inventory
 */
export const getResources = async (req, res, next) => {
  try {
    const queryValidation = resourceQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const result = await resourceService.getResources(queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 22: Add a New Resource
 */
export const createResource = async (req, res, next) => {
  try {
    const resource = await resourceService.createResource({
      data: req.body,
      facultyUserId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Resource added successfully to campus inventory.',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};
