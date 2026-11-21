import mongoose from 'mongoose';
import Resource from '../models/Resource.js';
import Allocation from '../models/Allocation.js';

/**
 * Calculates the maximum simultaneous allocated quantity during the requested interval
 * using discrete sweep-line event points.
 */
export const calculateMaxConcurrentQuantity = (allocations, requestedStart, requestedEnd) => {
  const reqStartTime = requestedStart.getTime();
  const reqEndTime = requestedEnd.getTime();

  const events = [];

  for (const alloc of allocations) {
    const allocStart = alloc.startAt.getTime();
    const allocEnd = alloc.endAt.getTime();

    const effectiveStart = Math.max(allocStart, reqStartTime);
    const effectiveEnd = Math.min(allocEnd, reqEndTime);

    if (effectiveStart < effectiveEnd) {
      events.push({ time: effectiveStart, delta: alloc.quantity, type: 'start' });
      events.push({ time: effectiveEnd, delta: -alloc.quantity, type: 'end' });
    }
  }

  // Sort events chronologically.
  // When times are identical, process 'end' (-delta) before 'start' (+delta)
  // because touching time boundaries do NOT overlap.
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.delta - b.delta;
  });

  let current = 0;
  let maxConcurrent = 0;

  for (const event of events) {
    current += event.delta;
    if (current > maxConcurrent) {
      maxConcurrent = current;
    }
  }

  return maxConcurrent;
};

/**
 * Evaluates real-time resource availability against active approved allocations.
 * Supports optional MongoDB transaction session for atomic consistency during approval.
 */
export const checkAvailability = async (
  { startAt, endAt, attendeeCount, requestedResources, excludeRequestId },
  { session } = {}
) => {
  const requestedStart = new Date(startAt);
  const requestedEnd = new Date(endAt);

  if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
    const error = new Error('Invalid startAt or endAt timestamp');
    error.statusCode = 400;
    throw error;
  }

  if (requestedEnd.getTime() <= requestedStart.getTime()) {
    const error = new Error('endAt must be later than startAt');
    error.statusCode = 400;
    throw error;
  }

  // De-duplicate requested resources and aggregate quantities for quantity resources
  const resourceMap = new Map();
  for (const item of requestedResources) {
    const rawId = item.resourceId?._id || item.resourceId;
    if (!rawId) continue;
    const idStr = rawId.toString();
    const qty = item.requestedQuantity ? Number(item.requestedQuantity) : undefined;

    if (resourceMap.has(idStr)) {
      const existing = resourceMap.get(idStr);
      if (qty) {
        existing.requestedQuantity = (existing.requestedQuantity || 0) + qty;
      }
    } else {
      resourceMap.set(idStr, {
        resourceId: rawId,
        requestedQuantity: qty,
      });
    }
  }

  const distinctRequested = Array.from(resourceMap.values());
  const resourceIds = distinctRequested.map((r) => new mongoose.Types.ObjectId(r.resourceId));

  // Load resources from MongoDB (within session if provided)
  const resourcesFromDb = await Resource.find(
    { _id: { $in: resourceIds } },
    null,
    session ? { session } : {}
  );
  const dbResourceMap = new Map(resourcesFromDb.map((r) => [r._id.toString(), r]));

  // Load active overlapping allocations (within session if provided)
  // Overlap condition: allocation.startAt < requestedEnd AND allocation.endAt > requestedStart
  // Exclude allocations that belong to the request being checked (prevents self-conflict)
  const allocQuery = {
    resourceId: { $in: resourceIds },
    status: 'active',
    startAt: { $lt: requestedEnd },
    endAt: { $gt: requestedStart },
  };

  if (excludeRequestId) {
    allocQuery.eventRequestId = { $ne: excludeRequestId };
  }

  const overlappingAllocations = await Allocation.find(
    allocQuery,
    null,
    session ? { session } : {}
  );

  const allocationsByResource = new Map();
  for (const alloc of overlappingAllocations) {
    const rId = alloc.resourceId.toString();
    if (!allocationsByResource.has(rId)) {
      allocationsByResource.set(rId, []);
    }
    allocationsByResource.get(rId).push(alloc);
  }

  const items = [];
  let overallAvailable = true;

  for (const requestedItem of distinctRequested) {
    const idStr = requestedItem.resourceId.toString();
    const resource = dbResourceMap.get(idStr);

    if (!resource) {
      items.push({
        resourceId: idStr,
        resourceName: 'Unknown',
        resourceMode: 'unknown',
        available: false,
        reason: 'Resource does not exist in the campus database.',
      });
      overallAvailable = false;
      continue;
    }

    if (!resource.isActive) {
      items.push({
        resourceId: idStr,
        resourceName: resource.name,
        resourceMode: resource.resourceMode,
        available: false,
        reason: `${resource.name} is currently inactive and cannot be requested.`,
      });
      overallAvailable = false;
      continue;
    }

    const allocs = allocationsByResource.get(idStr) || [];

    if (resource.resourceMode === 'capacity') {
      // 1. Check venue capacity
      if (attendeeCount > resource.capacity) {
        items.push({
          resourceId: idStr,
          resourceName: resource.name,
          resourceMode: 'capacity',
          capacity: resource.capacity,
          attendeeCount,
          available: false,
          reason: `Attendee count (${attendeeCount}) exceeds ${resource.name} capacity (${resource.capacity}).`,
        });
        overallAvailable = false;
        continue;
      }

      // 2. Check for overlapping approved allocations
      if (allocs.length > 0) {
        items.push({
          resourceId: idStr,
          resourceName: resource.name,
          resourceMode: 'capacity',
          capacity: resource.capacity,
          available: false,
          reason: `${resource.name} is already reserved for an approved event during this time slot.`,
        });
        overallAvailable = false;
        continue;
      }

      items.push({
        resourceId: idStr,
        resourceName: resource.name,
        resourceMode: 'capacity',
        capacity: resource.capacity,
        available: true,
        reason: `${resource.name} is available.`,
      });
    } else {
      // Quantity-based resource
      const requestedQty = requestedItem.requestedQuantity || 1;
      const maxAllocated = calculateMaxConcurrentQuantity(allocs, requestedStart, requestedEnd);
      const availableQty = Math.max(0, resource.totalQuantity - maxAllocated);

      const isAvailable = requestedQty <= availableQty;

      if (!isAvailable) {
        overallAvailable = false;
      }

      items.push({
        resourceId: idStr,
        resourceName: resource.name,
        resourceMode: 'quantity',
        requestedQuantity: requestedQty,
        availableQuantity: availableQty,
        totalQuantity: resource.totalQuantity,
        available: isAvailable,
        reason: isAvailable
          ? `${requestedQty} unit(s) of ${resource.name} are available.`
          : `Only ${availableQty} unit(s) of ${resource.name} available (requested ${requestedQty}).`,
      });
    }
  }

  return {
    overallAvailable,
    startAt: requestedStart.toISOString(),
    endAt: requestedEnd.toISOString(),
    items,
  };
};
