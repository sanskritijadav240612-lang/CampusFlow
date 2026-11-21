import mongoose from 'mongoose';
import * as facultyService from '../services/faculty.service.js';
import * as notificationService from '../services/notification.service.js';
import {
  facultyRequestsQuerySchema,
  notificationQuerySchema,
} from '../validators/faculty.schemas.js';

/**
 * Feature 18: Faculty Dashboard Statistics
 */
export const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await facultyService.getFacultyDashboard();
    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 19: List Faculty Request Inbox
 */
export const getRequests = async (req, res, next) => {
  try {
    const queryValidation = facultyRequestsQuerySchema.safeParse(req.query);
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

    const result = await facultyService.getFacultyRequests(queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 19: Get Event Request Details
 */
export const getRequestDetails = async (req, res, next) => {
  try {
    const request = await facultyService.getFacultyRequestDetails(req.params.requestId);
    return res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 19: Detect Conflicting Allocations and Competing Pending Requests
 */
export const getRequestConflicts = async (req, res, next) => {
  try {
    const conflicts = await facultyService.getFacultyRequestConflicts(req.params.requestId);
    return res.status(200).json({
      success: true,
      data: conflicts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 20: Atomically Approve Event Request
 */
export const approveRequest = async (req, res, next) => {
  try {
    const result = await facultyService.approveFacultyRequest({
      requestId: req.params.requestId,
      facultyUserId: req.user.id,
      decisionRemark: req.body.decisionRemark,
    });

    return res.status(200).json({
      success: true,
      message: 'Event request approved successfully and resources have been allocated.',
      data: result,
    });
  } catch (error) {
    // If conflict error has availability data attached
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
 * Feature 21: Reject Event Request
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const result = await facultyService.rejectFacultyRequest({
      requestId: req.params.requestId,
      facultyUserId: req.user.id,
      decisionRemark: req.body.decisionRemark,
    });

    return res.status(200).json({
      success: true,
      message: 'Event request has been rejected.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 23: Retrieve notification delivery history
 */
export const getNotifications = async (req, res, next) => {
  try {
    const queryValidation = notificationQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification query parameters',
        errors: queryValidation.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const result = await notificationService.getNotificationHistory(queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 23: Retry delivery for a pending or failed notification
 */
export const retryNotificationHandler = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await notificationService.retryNotification(req.params.notificationId);
    return res.status(200).json({
      success: true,
      message:
        notification.status === 'sent'
          ? 'Notification resent successfully.'
          : 'Notification retry initiated.',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};
