import Resource from '../models/Resource.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Feature 22: Get Campus Resource Inventory
 */
export const getResources = async (query = {}) => {
  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.resourceMode) {
    filter.resourceMode = query.resourceMode;
  }

  if (query.isActive !== undefined && query.isActive !== 'all') {
    filter.isActive = query.isActive === 'true';
  }

  if (query.search) {
    filter.name = { $regex: query.search.trim(), $options: 'i' };
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 50));
  const skip = (page - 1) * limit;

  const [total, resources] = await Promise.all([
    Resource.countDocuments(filter),
    Resource.find(filter)
      .select('_id name category resourceMode capacity totalQuantity description location isActive createdAt updatedAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    resources,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Feature 22: Add a Resource to Campus Inventory
 */
export const createResource = async ({ data, facultyUserId }) => {
  const trimmedName = data.name.trim();

  // Case-insensitive duplicate check to prevent duplicate campus resources
  const existing = await Resource.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
  });

  if (existing) {
    const error = new Error(`A resource with the name "${trimmedName}" already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const resource = await Resource.create({
    name: trimmedName,
    category: data.category.trim(),
    resourceMode: data.resourceMode,
    capacity: data.resourceMode === 'capacity' ? data.capacity : undefined,
    totalQuantity: data.resourceMode === 'quantity' ? data.totalQuantity : undefined,
    description: (data.description || '').trim(),
    location: (data.location || '').trim(),
    isActive: true,
    scheduleVersion: 0,
    createdBy: facultyUserId,
  });

  // Record AuditLog
  try {
    await AuditLog.create({
      actorUserId: facultyUserId,
      actorType: 'user',
      action: 'resource_created',
      targetType: 'resource',
      targetId: resource._id,
      resourceId: resource._id,
      metadata: {
        name: resource.name,
        category: resource.category,
        resourceMode: resource.resourceMode,
        capacity: resource.capacity || null,
        totalQuantity: resource.totalQuantity || null,
      },
    });
  } catch (auditErr) {
    console.error('AuditLog creation warning on resource_created:', auditErr.message);
  }

  return resource;
};
