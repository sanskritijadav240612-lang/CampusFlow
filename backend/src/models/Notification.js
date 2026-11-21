import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    eventRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      required: [true, 'Event request ID reference is required'],
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid recipient email address'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['request_approved', 'request_rejected', 'request_submitted'],
        message: '{VALUE} is not a valid notification type. Allowed types: request_approved, request_rejected, request_submitted',
      },
    },
    status: {
      type: String,
      required: [true, 'Notification status is required'],
      enum: {
        values: ['pending', 'processing', 'sent', 'failed'],
        message: '{VALUE} is not a valid notification status. Allowed statuses: pending, processing, sent, failed',
      },
      default: 'pending',
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'Attempt count must be a non-negative integer',
      },
    },
    lastError: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    dedupeKey: {
      type: String,
      required: [true, 'Deduplication key is required'],
      trim: true,
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
// 1. Unique index on dedupeKey to prevent duplicate emails for the same decision event
notificationSchema.index({ dedupeKey: 1 }, { unique: true });

// 2. Query notification history by event request
notificationSchema.index({ eventRequestId: 1, createdAt: -1 });

// 3. Query notification history by recipient
notificationSchema.index({ recipientEmail: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
