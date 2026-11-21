import mongoose from 'mongoose';
import EventRequest from '../models/EventRequest.js';
import Conversation from '../models/Conversation.js';
import * as availabilityService from './availability.service.js';

/**
 * Creates an event request with status 'Under Review' after re-verifying availability
 */
export const createEventRequest = async ({ studentId, data }) => {
  // If conversationId is provided, confirm it belongs to the student
  if (data.conversationId) {
    const conversation = await Conversation.findOne({
      _id: data.conversationId,
      studentId,
    });

    if (!conversation) {
      const error = new Error('Referenced conversation not found or does not belong to you.');
      error.statusCode = 404;
      throw error;
    }
  }

  // Re-run real-time availability check against current approved allocations
  const availabilityResult = await availabilityService.checkAvailability({
    startAt: data.startAt,
    endAt: data.endAt,
    attendeeCount: data.attendeeCount,
    requestedResources: data.requestedResources,
  });

  if (!availabilityResult.overallAvailable) {
    const conflictError = new Error('One or more requested resources are unavailable for the selected time window.');
    conflictError.statusCode = 409;
    conflictError.data = availabilityResult;
    throw conflictError;
  }

  // Create event request directly with status 'Under Review'
  const newRequest = await EventRequest.create({
    studentId,
    conversationId: data.conversationId || null,
    title: data.title.trim(),
    description: data.description.trim(),
    eventType: (data.eventType || '').trim(),
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    attendeeCount: data.attendeeCount,
    requestedResources: data.requestedResources.map((r) => ({
      resourceId: r.resourceId,
      requestedQuantity: r.requestedQuantity || undefined,
    })),
    status: 'Under Review',
  });

  return newRequest;
};

/**
 * Retrieves paginated request history for the authenticated student
 */
export const getMyRequests = async ({ studentId, query }) => {
  const filter = { studentId };

  if (query.status) {
    filter.status = query.status;
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const [total, requests] = await Promise.all([
    EventRequest.countDocuments(filter),
    EventRequest.find(filter)
      .populate('requestedResources.resourceId', 'name category resourceMode capacity totalQuantity location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Retrieves a single event request owned by the student
 */
export const getRequestById = async ({ studentId, requestId }) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  const request = await EventRequest.findOne({
    _id: requestId,
    studentId,
  }).populate('requestedResources.resourceId', 'name category resourceMode capacity totalQuantity location');

  if (!request) {
    const error = new Error('Event request not found');
    error.statusCode = 404;
    throw error;
  }

  return request;
};
