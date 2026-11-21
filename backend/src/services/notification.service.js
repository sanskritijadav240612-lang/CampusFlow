import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import EventRequest from '../models/EventRequest.js';
import User from '../models/User.js';
import * as emailService from './email.service.js';

// Maximum delivery attempts permitted per notification
const MAX_ATTEMPTS = 5;

// Stale lock recovery threshold: 2 minutes
const STALE_LOCK_MS = 2 * 60 * 1000;

/**
 * Feature 23 & 25: Dispatches a notification via Nodemailer with safe atomic claim protection
 */
export const dispatchNotification = async (notificationId) => {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  const staleThreshold = new Date(Date.now() - STALE_LOCK_MS);

  // Safe Atomic Claim:
  // Transitions status to 'processing' and records 'lockedAt' timestamp.
  // Matches notifications that are 'pending' or 'failed' (under MAX_ATTEMPTS),
  // OR recovering from a stale 'processing' state where the worker crashed > 2 minutes ago.
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      attemptCount: { $lt: MAX_ATTEMPTS },
      $or: [
        { status: { $in: ['pending', 'failed'] } },
        { status: 'processing', lockedAt: { $lt: staleThreshold } },
      ],
    },
    {
      $set: {
        status: 'processing',
        lockedAt: new Date(),
      },
      $inc: { attemptCount: 1 },
    },
    { new: true }
  );

  if (!notification) {
    // Already sent, actively processing by another worker, or exceeded maximum attempts
    return null;
  }

  try {
    // Fetch EventRequest and student details
    const request = await EventRequest.findById(notification.eventRequestId).populate(
      'requestedResources.resourceId',
      'name'
    );

    if (!request) {
      notification.status = 'failed';
      notification.lockedAt = null;
      notification.lastError = 'Associated EventRequest record not found.';
      await notification.save();
      return notification;
    }

    const student = await User.findById(request.studentId);
    const studentName = student ? student.name : 'Student';
    const recipientEmail = notification.recipientEmail;

    let subject = '';
    let html = '';

    if (notification.type === 'request_submitted') {
      subject = `CampusFlow: Event Request Submitted - ${request.title}`;
      html = emailService.renderSubmissionEmail({
        studentName,
        eventTitle: request.title,
        requestId: request._id.toString(),
        startAt: request.startAt,
        endAt: request.endAt,
        resources: request.requestedResources,
      });
    } else if (notification.type === 'request_approved') {
      subject = `CampusFlow: Event Request Approved - ${request.title}`;
      html = emailService.renderApprovalEmail({
        studentName,
        eventTitle: request.title,
        requestId: request._id.toString(),
        startAt: request.startAt,
        endAt: request.endAt,
        resources: request.requestedResources,
        decisionRemark: request.decisionRemark,
        decisionAt: request.decisionAt || new Date(),
      });
    } else if (notification.type === 'request_rejected') {
      subject = `CampusFlow: Event Request Update - ${request.title}`;
      html = emailService.renderRejectionEmail({
        studentName,
        eventTitle: request.title,
        requestId: request._id.toString(),
        startAt: request.startAt,
        endAt: request.endAt,
        decisionRemark: request.decisionRemark,
        decisionAt: request.decisionAt || new Date(),
      });
    } else {
      notification.status = 'failed';
      notification.lockedAt = null;
      notification.lastError = `Unknown notification type: ${notification.type}`;
      await notification.save();
      return notification;
    }

    // Attempt delivery through email service
    const result = await emailService.sendDecisionEmail({
      to: recipientEmail,
      subject,
      html,
    });

    if (result.success) {
      notification.status = 'sent';
      notification.lockedAt = null;
      notification.providerMessageId = result.messageId;
      notification.sentAt = new Date();
      notification.lastError = null;
    } else {
      notification.status = 'failed';
      notification.lockedAt = null;
      // Sanitize error message to prevent leaking internal provider credentials
      notification.lastError = typeof result.error === 'string'
        ? result.error.slice(0, 500)
        : 'Delivery failure';
    }

    await notification.save();
    return notification;
  } catch (dispatchErr) {
    notification.status = 'failed';
    notification.lockedAt = null;
    notification.lastError = dispatchErr.message ? dispatchErr.message.slice(0, 500) : 'Unexpected dispatch error';
    await notification.save();
    return notification;
  }
};

/**
 * Feature 23 & 25: Controlled retry for failed or pending notifications
 */
export const retryNotification = async (notificationId) => {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    const error = new Error('Invalid notification ID format');
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.status === 'sent') {
    const error = new Error('Notification has already been sent successfully.');
    error.statusCode = 400;
    throw error;
  }

  const STALE_THRESHOLD_MS = 2 * 60 * 1000;
  if (
    notification.status === 'processing' &&
    notification.lockedAt &&
    Date.now() - new Date(notification.lockedAt).getTime() < STALE_THRESHOLD_MS
  ) {
    const error = new Error('Notification is currently being dispatched by an active worker. Please wait.');
    error.statusCode = 409;
    throw error;
  }

  if (notification.attemptCount >= MAX_ATTEMPTS) {
    const error = new Error(`Maximum retry limit reached (${MAX_ATTEMPTS} attempts).`);
    error.statusCode = 400;
    throw error;
  }

  const updatedNotification = await dispatchNotification(notification._id);
  return updatedNotification || notification;
};

/**
 * Feature 23: Retrieve notification history for faculty review with filtering
 */
export const getNotificationHistory = async (query = {}) => {
  const filter = {};

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.type && query.type !== 'all') {
    filter.type = query.type;
  }

  if (query.eventRequestId) {
    if (mongoose.Types.ObjectId.isValid(query.eventRequestId)) {
      filter.eventRequestId = query.eventRequestId;
    }
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .populate({
        path: 'eventRequestId',
        select: 'title studentId startAt endAt',
        populate: {
          path: 'studentId',
          select: 'name email enrollmentNumber',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
