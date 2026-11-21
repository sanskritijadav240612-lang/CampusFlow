import mongoose from 'mongoose';

const requestedResourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID reference is required'],
    },
    requestedQuantity: {
      type: Number,
      validate: {
        validator: function (value) {
          if (value === undefined || value === null) return true;
          return Number.isInteger(value) && value > 0;
        },
        message: 'Requested quantity must be a positive integer',
      },
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

const eventRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required'],
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [2, 'Event title must be at least 2 characters long'],
      maxlength: [150, 'Event title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [5, 'Event description must be at least 5 characters long'],
      maxlength: [2000, 'Event description cannot exceed 2000 characters'],
    },
    eventType: {
      type: String,
      trim: true,
      maxlength: [50, 'Event type cannot exceed 50 characters'],
      default: '',
    },
    startAt: {
      type: Date,
      required: [true, 'Event start date and time is required'],
    },
    endAt: {
      type: Date,
      required: [true, 'Event end date and time is required'],
      validate: {
        validator: function (value) {
          if (!this.startAt || !value) return true;
          return new Date(value) > new Date(this.startAt);
        },
        message: 'Event end time must be later than start time',
      },
    },
    attendeeCount: {
      type: Number,
      required: [true, 'Attendee count is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value > 0;
        },
        message: 'Attendee count must be a positive integer',
      },
    },
    requestedResources: {
      type: [requestedResourceSchema],
      required: [true, 'At least one requested resource is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'At least one requested resource is required',
      },
    },
    status: {
      type: String,
      required: [true, 'Event request status is required'],
      enum: {
        values: ['Under Review', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid status. Allowed values: Under Review, Approved, Rejected',
      },
      default: 'Under Review',
    },
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decisionAt: {
      type: Date,
      default: null,
    },
    decisionRemark: {
      type: String,
      trim: true,
      maxlength: [1000, 'Decision remark cannot exceed 1000 characters'],
      default: '',
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
// 1. Efficient retrieval of a student's submission history
eventRequestSchema.index({ studentId: 1, createdAt: -1 });

// 2. Efficient retrieval for faculty inbox filtered by status and sorted by recency
eventRequestSchema.index({ status: 1, createdAt: -1 });

// 3. Date-based filtering for schedule lookups and timeline queries
eventRequestSchema.index({ startAt: 1, endAt: 1 });

export const EventRequest = mongoose.model('EventRequest', eventRequestSchema);
export default EventRequest;
