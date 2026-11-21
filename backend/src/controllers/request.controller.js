import * as availabilityService from '../services/availability.service.js';
import * as requestService from '../services/request.service.js';
import { myRequestsQuerySchema } from '../validators/request.schemas.js';

/**
 * Check real-time resource availability
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const result = await availabilityService.checkAvailability(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a new student event request
 */
export const createRequest = async (req, res, next) => {
  try {
    const request = await requestService.createEventRequest({
      studentId: req.user.id,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'Event request submitted successfully and is now Under Review.',
      data: { request },
    });
  } catch (error) {
    // If conflict error has availability breakdown attached
    if (error.statusCode === 409 && error.data) {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: error.data,
      });
    }
    next(error);
  }
};

/**
 * Get current student's event request history
 */
export const getMyRequests = async (req, res, next) => {
  try {
    const queryValidation = myRequestsQuerySchema.safeParse(req.query);
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

    const result = await requestService.getMyRequests({
      studentId: req.user.id,
      query: queryValidation.data,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single request details by ID
 */
export const getRequestById = async (req, res, next) => {
  try {
    const request = await requestService.getRequestById({
      studentId: req.user.id,
      requestId: req.params.requestId,
    });

    return res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};
