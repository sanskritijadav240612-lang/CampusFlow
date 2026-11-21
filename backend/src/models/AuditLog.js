import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorType: {
      type: String,
      required: [true, 'Actor type is required'],
      enum: {
        values: ['user', 'system'],
        message: '{VALUE} is not a valid actor type. Allowed types: user, system',
      },
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: {
        values: [
          'request_approved',
          'request_rejected',
          'resource_created',
          'faculty_account_created',
          'faculty_account_updated',
        ],
        message: '{VALUE} is not a valid audit action',
      },
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: {
        values: ['eventRequest', 'resource', 'user'],
        message: '{VALUE} is not a valid target type. Allowed types: eventRequest, resource, user',
      },
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
    },
    eventRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
// 1. History of actions taken by a specific actor
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });

// 2. Audit trail for a specific target entity
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// 3. System-wide monitoring and filtering by action type
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
