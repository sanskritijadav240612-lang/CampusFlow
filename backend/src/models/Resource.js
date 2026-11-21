import mongoose from 'mongoose';

/**
 * Helper to extract resourceMode from document or update query context
 */
function getResourceMode(context) {
  if (!context) return undefined;
  if (context.resourceMode) return context.resourceMode;
  if (typeof context.getUpdate === 'function') {
    const update = context.getUpdate();
    if (update) {
      if (update.resourceMode) return update.resourceMode;
      if (update.$set && update.$set.resourceMode) return update.$set.resourceMode;
    }
  }
  return undefined;
}

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      minlength: [2, 'Resource name must be at least 2 characters long'],
      maxlength: [100, 'Resource name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters long'],
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    resourceMode: {
      type: String,
      required: [true, 'Resource mode is required'],
      enum: {
        values: ['capacity', 'quantity'],
        message: '{VALUE} is not a valid resource mode. Allowed modes: capacity, quantity',
      },
    },
    capacity: {
      type: Number,
      required: [
        function () {
          return getResourceMode(this) === 'capacity';
        },
        'Capacity is required for capacity-based resources',
      ],
      validate: [
        {
          validator: function (value) {
            if (value === undefined || value === null) return true;
            return getResourceMode(this) !== 'quantity';
          },
          message: 'Capacity must not be provided for quantity-based resources',
        },
        {
          validator: function (value) {
            if (value === undefined || value === null) return true;
            return Number.isInteger(value) && value > 0;
          },
          message: 'Capacity must be a positive integer',
        },
      ],
    },
    totalQuantity: {
      type: Number,
      required: [
        function () {
          return getResourceMode(this) === 'quantity';
        },
        'Total quantity is required for quantity-based resources',
      ],
      validate: [
        {
          validator: function (value) {
            if (value === undefined || value === null) return true;
            return getResourceMode(this) !== 'capacity';
          },
          message: 'Total quantity must not be provided for capacity-based resources',
        },
        {
          validator: function (value) {
            if (value === undefined || value === null) return true;
            return Number.isInteger(value) && value > 0;
          },
          message: 'Total quantity must be a positive integer',
        },
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scheduleVersion: {
      type: Number,
      default: 0,
      min: [0, 'Schedule version cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user reference is required'],
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

// Normalize empty/null numeric values before validation
resourceSchema.pre('validate', function (next) {
  if (this.capacity === null || this.capacity === '') {
    this.capacity = undefined;
  }
  if (this.totalQuantity === null || this.totalQuantity === '') {
    this.totalQuantity = undefined;
  }
  next();
});

// Indexes for common query patterns
resourceSchema.index({ name: 1 });
resourceSchema.index({ category: 1, isActive: 1 });
resourceSchema.index({ createdBy: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
