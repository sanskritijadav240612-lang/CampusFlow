import mongoose from 'mongoose';
import EventRequest from '../models/EventRequest.js';
import Resource from '../models/Resource.js';
import Allocation from '../models/Allocation.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { checkAvailability, calculateMaxConcurrentQuantity } from './availability.service.js';

const MAX_TRANSACTION_RETRIES = 3;

/**
 * Feature 18: Faculty Dashboard Statistics
 */
export const getFacultyDashboard = async () => {
  const now = new Date();

  // 1. Total active resources
  const totalActiveResources = await Resource.countDocuments({ isActive: true });

  // 2. Pending requests under review
  const pendingRequestsCount = await EventRequest.countDocuments({ status: 'Under Review' });

  // 3. Current active allocations: startAt <= now && endAt > now && status: 'active'
  const currentAllocations = await Allocation.find({
    status: 'active',
    startAt: { $lte: now },
    endAt: { $gt: now },
  }).populate('resourceId', 'resourceMode');

  let currentlyOccupiedVenues = 0;
  let currentlyAllocatedEquipment = 0;

  for (const alloc of currentAllocations) {
    if (alloc.resourceId) {
      if (alloc.resourceId.resourceMode === 'capacity') {
        currentlyOccupiedVenues += 1;
      } else if (alloc.resourceId.resourceMode === 'quantity') {
        currentlyAllocatedEquipment += alloc.quantity;
      }
    }
  }

  // 4. Recent pending requests requiring faculty attention (oldest first for urgency, limit 5)
  const recentPendingRequests = await EventRequest.find({ status: 'Under Review' })
    .populate('studentId', 'name email enrollmentNumber')
    .populate('requestedResources.resourceId', 'name category resourceMode location')
    .sort({ createdAt: 1 })
    .limit(5);

  return {
    totalActiveResources,
    pendingRequestsCount,
    currentlyOccupiedVenues,
    currentlyAllocatedEquipment,
    recentPendingRequests,
  };
};

/**
 * Feature 19: List Faculty Request Inbox with Filtering and Search
 */
export const getFacultyRequests = async ({ status = 'Under Review', page = 1, limit = 10, search = '' }) => {
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  // Search by event title or student name
  if (search) {
    const matchingStudents = await User.find({
      role: 'student',
      name: { $regex: search, $options: 'i' },
    }).select('_id');

    const studentIds = matchingStudents.map((s) => s._id);

    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { studentId: { $in: studentIds } },
    ];
  }

  const validPage = Math.max(1, page);
  const validLimit = Math.min(50, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  // Under Review requests sorted oldest first; other statuses sorted newest first
  const sort = filter.status === 'Under Review' ? { createdAt: 1 } : { createdAt: -1 };

  const [total, requests] = await Promise.all([
    EventRequest.countDocuments(filter),
    EventRequest.find(filter)
      .populate('studentId', 'name email enrollmentNumber')
      .populate('requestedResources.resourceId', 'name category resourceMode capacity totalQuantity location')
      .sort(sort)
      .skip(skip)
      .limit(validLimit),
  ]);

  return {
    requests,
    pagination: {
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    },
  };
};

/**
 * Feature 19: Get Complete Event Request Details
 */
export const getFacultyRequestDetails = async (requestId) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  const request = await EventRequest.findById(requestId)
    .populate('studentId', 'name email enrollmentNumber')
    .populate('decisionBy', 'name email facultyId')
    .populate('requestedResources.resourceId', 'name category resourceMode capacity totalQuantity location');

  if (!request) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  return request;
};

/**
 * Feature 19: Detect Conflicting Allocations and Competing Under Review Requests
 */
export const getFacultyRequestConflicts = async (requestId) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  const request = await EventRequest.findById(requestId)
    .populate('studentId', 'name email enrollmentNumber')
    .populate('requestedResources.resourceId', 'name category resourceMode capacity totalQuantity location');

  if (!request) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  const { startAt, endAt, attendeeCount, requestedResources } = request;
  const resourceIds = requestedResources.map((r) => r.resourceId._id || r.resourceId);

  // 1. Find overlapping active allocations for the same resources
  const overlappingAllocations = await Allocation.find({
    resourceId: { $in: resourceIds },
    status: 'active',
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }).populate({
    path: 'eventRequestId',
    select: 'title studentId startAt endAt',
    populate: { path: 'studentId', select: 'name email enrollmentNumber' },
  });

  // 2. Find competing Under Review requests requiring the same resources during overlapping time
  const competingPendingRequests = await EventRequest.find({
    _id: { $ne: request._id },
    status: 'Under Review',
    'requestedResources.resourceId': { $in: resourceIds },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }).populate('studentId', 'name email enrollmentNumber');

  const resourceConflicts = [];
  let hasAnyConflict = false;

  for (const item of requestedResources) {
    const resource = item.resourceId;
    const rIdStr = (resource._id || resource).toString();

    // Overlapping allocations for this specific resource
    const allocs = overlappingAllocations.filter(
      (a) => a.resourceId.toString() === rIdStr
    );

    // Competing pending requests for this specific resource
    const competing = competingPendingRequests.filter((cr) =>
      cr.requestedResources.some((reqRes) => reqRes.resourceId.toString() === rIdStr)
    );

    if (resource.resourceMode === 'capacity') {
      const isCapacityExceeded = attendeeCount > resource.capacity;
      const isVenueAllocated = allocs.length > 0;
      const hasConflict = isCapacityExceeded || isVenueAllocated;

      if (hasConflict) {
        hasAnyConflict = true;
      }

      let conflictReason = null;
      if (isCapacityExceeded) {
        conflictReason = `Attendee count (${attendeeCount}) exceeds venue capacity (${resource.capacity}).`;
      } else if (isVenueAllocated) {
        conflictReason = 'Venue is already reserved by an active approved allocation during this time window.';
      }

      resourceConflicts.push({
        resourceId: resource._id,
        resourceName: resource.name,
        resourceMode: 'capacity',
        capacity: resource.capacity,
        attendeeCount,
        hasConflict,
        conflictReason,
        overlappingAllocations: allocs.map((a) => ({
          allocationId: a._id,
          eventRequestId: a.eventRequestId?._id,
          eventTitle: a.eventRequestId?.title,
          student: a.eventRequestId?.studentId,
          startAt: a.startAt,
          endAt: a.endAt,
        })),
        competingPendingRequests: competing.map((c) => ({
          requestId: c._id,
          eventTitle: c.title,
          student: c.studentId,
          attendeeCount: c.attendeeCount,
          startAt: c.startAt,
          endAt: c.endAt,
        })),
      });
    } else {
      // Quantity-based resource
      const requestedQuantity = item.requestedQuantity || 1;
      const maxAllocated = calculateMaxConcurrentQuantity(allocs, startAt, endAt);
      const remainingQuantity = Math.max(0, resource.totalQuantity - maxAllocated);
      const hasConflict = requestedQuantity > remainingQuantity;

      if (hasConflict) {
        hasAnyConflict = true;
      }

      resourceConflicts.push({
        resourceId: resource._id,
        resourceName: resource.name,
        resourceMode: 'quantity',
        totalQuantity: resource.totalQuantity,
        maxAllocatedQuantity: maxAllocated,
        remainingQuantity,
        requestedQuantity,
        hasConflict,
        conflictReason: hasConflict
          ? `Only ${remainingQuantity} unit(s) available (requested ${requestedQuantity}).`
          : null,
        overlappingAllocations: allocs.map((a) => ({
          allocationId: a._id,
          eventRequestId: a.eventRequestId?._id,
          eventTitle: a.eventRequestId?.title,
          student: a.eventRequestId?.studentId,
          allocatedQuantity: a.quantity,
          startAt: a.startAt,
          endAt: a.endAt,
        })),
        competingPendingRequests: competing.map((c) => {
          const competingItem = c.requestedResources.find(
            (rr) => rr.resourceId.toString() === rIdStr
          );
          return {
            requestId: c._id,
            eventTitle: c.title,
            student: c.studentId,
            requestedQuantity: competingItem?.requestedQuantity || 1,
            startAt: c.startAt,
            endAt: c.endAt,
          };
        }),
      });
    }
  }

  return {
    requestId: request._id,
    eventTitle: request.title,
    startAt: request.startAt,
    endAt: request.endAt,
    hasAnyConflict,
    resourceConflicts,
  };
};

/**
 * Feature 20: Atomically Approve Event Request with MongoDB Transactions and Concurrency Guard
 */
export const approveFacultyRequest = async ({ requestId, facultyUserId, decisionRemark }) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  let attempt = 0;

  while (attempt < MAX_TRANSACTION_RETRIES) {
    attempt++;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Load EventRequest within transaction
      const request = await EventRequest.findById(requestId).session(session);
      if (!request) {
        await session.abortTransaction();
        const error = new Error('Event request not found');
        error.statusCode = 404;
        throw error;
      }

      if (request.status !== 'Under Review') {
        await session.abortTransaction();
        const error = new Error(`Request has already been decided with status: ${request.status}`);
        error.statusCode = 409;
        throw error;
      }

      // 2. Concurrency protection: increment scheduleVersion on all requested resources inside session
      const resourceIds = request.requestedResources.map((r) => r.resourceId);

      const updateResult = await Resource.updateMany(
        { _id: { $in: resourceIds }, isActive: true },
        { $inc: { scheduleVersion: 1 } },
        { session }
      );

      if (updateResult.matchedCount !== resourceIds.length) {
        await session.abortTransaction();
        const error = new Error('One or more requested resources do not exist or are inactive.');
        error.statusCode = 409;
        throw error;
      }

      // 3. Recheck availability within transaction session (after acquiring resource locks)
      const availabilityResult = await checkAvailability(
        {
          startAt: request.startAt,
          endAt: request.endAt,
          attendeeCount: request.attendeeCount,
          requestedResources: request.requestedResources,
        },
        { session }
      );

      if (!availabilityResult.overallAvailable) {
        await session.abortTransaction();
        const error = new Error('One or more requested resources are no longer available.');
        error.statusCode = 409;
        error.data = availabilityResult;
        throw error;
      }

      // 4. Create Allocation records within session
      const allocationsToCreate = request.requestedResources.map((item) => ({
        eventRequestId: request._id,
        resourceId: item.resourceId,
        quantity: item.requestedQuantity || 1, // capacity-based uses quantity 1
        startAt: request.startAt,
        endAt: request.endAt,
        status: 'active',
      }));

      await Allocation.insertMany(allocationsToCreate, { session });

      // 5. Update EventRequest status to Approved
      request.status = 'Approved';
      request.decisionBy = facultyUserId;
      request.decisionAt = new Date();
      if (decisionRemark && typeof decisionRemark === 'string') {
        request.decisionRemark = decisionRemark.trim();
      }
      await request.save({ session });

      // 6. Create pending Notification record within session
      const student = await User.findById(request.studentId).session(session);
      const recipientEmail = student?.email || 'unknown@campus.edu';
      const dedupeKey = `req-${request._id.toString()}-approved`;

      const [notification] = await Notification.create(
        [
          {
            eventRequestId: request._id,
            recipientEmail,
            type: 'request_approved',
            status: 'pending',
            dedupeKey,
          },
        ],
        { session }
      );

      // 7. Commit transaction
      await session.commitTransaction();

      // 8. Record audit log asynchronously after commit
      try {
        await AuditLog.create({
          actorUserId: facultyUserId,
          actorType: 'user',
          action: 'request_approved',
          targetType: 'eventRequest',
          targetId: request._id,
          eventRequestId: request._id,
          metadata: {
            title: request.title,
            studentId: request.studentId,
            remark: request.decisionRemark || undefined,
            allocatedResourcesCount: allocationsToCreate.length,
          },
        });
      } catch (auditErr) {
        console.error('AuditLog creation warning:', auditErr.message);
      }

      return {
        request: request.toJSON(),
        notification: notification ? notification.toJSON() : null,
      };
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      // Handle transient transaction/write conflict errors with idempotent retries
      const isTransientError =
        err.hasErrorLabel?.('TransientTransactionError') ||
        err.message?.includes('WriteConflict') ||
        err.code === 112; // MongoDB WriteConflict code

      if (isTransientError && attempt < MAX_TRANSACTION_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
        continue;
      }

      throw err;
    } finally {
      await session.endSession();
    }
  }
};

/**
 * Feature 21: Reject Event Request
 */
export const rejectFacultyRequest = async ({ requestId, facultyUserId, decisionRemark }) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  const request = await EventRequest.findById(requestId);
  if (!request) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'Under Review') {
    const error = new Error(`Request has already been decided with status: ${request.status}`);
    error.statusCode = 409;
    throw error;
  }

  request.status = 'Rejected';
  request.decisionBy = facultyUserId;
  request.decisionAt = new Date();
  if (decisionRemark && typeof decisionRemark === 'string') {
    request.decisionRemark = decisionRemark.trim();
  }
  await request.save();

  // Create pending Notification record
  const student = await User.findById(request.studentId);
  const recipientEmail = student?.email || 'unknown@campus.edu';
  const dedupeKey = `req-${request._id.toString()}-rejected`;

  let notification = null;
  try {
    notification = await Notification.create({
      eventRequestId: request._id,
      recipientEmail,
      type: 'request_rejected',
      status: 'pending',
      dedupeKey,
    });
  } catch (notifErr) {
    // If dedupeKey conflict occurs, retrieve existing
    if (notifErr.code === 11000) {
      notification = await Notification.findOne({ dedupeKey });
    } else {
      console.error('Notification creation warning on reject:', notifErr.message);
    }
  }

  // Record AuditLog
  try {
    await AuditLog.create({
      actorUserId: facultyUserId,
      actorType: 'user',
      action: 'request_rejected',
      targetType: 'eventRequest',
      targetId: request._id,
      eventRequestId: request._id,
      metadata: {
        title: request.title,
        studentId: request.studentId,
        remark: request.decisionRemark || undefined,
      },
    });
  } catch (auditErr) {
    console.error('AuditLog creation warning on reject:', auditErr.message);
  }

  return {
    request: request.toJSON(),
    notification: notification ? notification.toJSON() : null,
  };
};
