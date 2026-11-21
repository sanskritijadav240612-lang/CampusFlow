import Notification from '../models/Notification.js';
import EventRequest from '../models/EventRequest.js';
import User from '../models/User.js';
import * as emailService from './email.service.js';

/**
 * Feature 23: Dispatches a notification via Resend with atomic claim protection
 */
export const dispatchNotification = async (notificationId) => {
  if (!notificationId) return null;

  // Atomic claim: only claim a notification that is currently 'pending' or 'failed'
  // Prevents two concurrent workers from duplicating the email
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      status: { $in: ['pending', 'failed'] },
    },
    {
      $inc: { attemptCount: 1 },
    },
    { new: true }
  );

  if (!notification) {
    // Already sent or claimed
    return null;
  }

  // Fetch EventRequest and student details
  const request = await EventRequest.findById(notification.eventRequestId).populate(
    'requestedResources.resourceId',
    'name'
  );

  if (!request) {
    notification.status = 'failed';
    notification.lastError = 'Associated EventRequest record not found.';
    await notification.save();
    return notification;
  }

  const student = await User.findById(request.studentId);
  const studentName = student ? student.name : 'Student';
  const recipientEmail = notification.recipientEmail;

  let subject = '';
  let html = '';

  if (notification.type === 'request_approved') {
    subject = `CampusFlow: Event Request Approved - ${request.title}`;
    html = emailService.renderApprovalEmail({
      studentName,
      eventTitle: request.title,
      startAt: request.startAt,
      endAt: request.endAt,
      resources: request.requestedResources,
      decisionRemark: request.decisionRemark,
    });
  } else if (notification.type === 'request_rejected') {
    subject = `CampusFlow: Event Request Update - ${request.title}`;
    html = emailService.renderRejectionEmail({
      studentName,
      eventTitle: request.title,
      startAt: request.startAt,
      endAt: request.endAt,
      decisionRemark: request.decisionRemark,
    });
  } else {
    notification.status = 'failed';
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
    notification.providerMessageId = result.messageId;
    notification.sentAt = new Date();
    notification.lastError = null;
  } else {
    notification.status = 'failed';
    notification.lastError = result.error || 'Unknown delivery failure';
  }

  await notification.save();
  return notification;
};

/**
 * Feature 23: Controlled retry for failed or pending notifications
 */
export const retryNotification = async (notificationId) => {
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

  const updatedNotification = await dispatchNotification(notification._id);
  return updatedNotification || notification;
};

/**
 * Feature 23: Retrieve notification history for faculty review
 */
export const getNotificationHistory = async (query = {}) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.type) {
    filter.type = query.type;
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
