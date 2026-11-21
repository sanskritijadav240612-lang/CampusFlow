import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    eventRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      required: [true, 'Event request ID reference is required'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Allocated quantity is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value > 0;
        },
        message: 'Allocated quantity must be a positive integer',
      },
    },
    startAt: {
      type: Date,
      required: [true, 'Allocation start date and time is required'],
    },
    endAt: {
      type: Date,
      required: [true, 'Allocation end date and time is required'],
      validate: {
        validator: function (value) {
          if (!this.startAt || !value) return true;
          return new Date(value) > new Date(this.startAt);
        },
        message: 'Allocation end time must be later than start time',
      },
    },
    status: {
      type: String,
      required: [true, 'Allocation status is required'],
      enum: {
        values: ['active'],
        message: '{VALUE} is not a valid allocation status. Allowed status: active',
      },
      default: 'active',
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
// 1. Core index for availability overlap lookups by resource, time window, and status
allocationSchema.index({ resourceId: 1, startAt: 1, endAt: 1, status: 1 });

// 2. Querying all allocations associated with an event request
allocationSchema.index({ eventRequestId: 1 });

export const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
