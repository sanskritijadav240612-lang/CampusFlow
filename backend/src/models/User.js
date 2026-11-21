import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['student', 'faculty'],
        message: '{VALUE} is not a valid role. Allowed roles: student, faculty',
      },
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.role === 'student';
        },
        'Enrollment number is required for students',
      ],
      validate: {
        validator: function (value) {
          if (this.role === 'faculty' && value !== undefined && value !== null) {
            return false;
          }
          return true;
        },
        message: 'Enrollment number is not allowed for faculty members',
      },
    },
    facultyId: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.role === 'faculty';
        },
        'Faculty ID is required for faculty members',
      ],
      validate: {
        validator: function (value) {
          if (this.role === 'student' && value !== undefined && value !== null) {
            return false;
          }
          return true;
        },
        message: 'Faculty ID is not allowed for student accounts',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.refreshTokenExpiresAt;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.refreshTokenExpiresAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Normalize empty strings to undefined before validation so role constraints and partial indexes operate cleanly
userSchema.pre('validate', function (next) {
  if (typeof this.enrollmentNumber === 'string') {
    const trimmed = this.enrollmentNumber.trim();
    this.enrollmentNumber = trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof this.facultyId === 'string') {
    const trimmed = this.facultyId.trim();
    this.facultyId = trimmed.length > 0 ? trimmed : undefined;
  }
  next();
});

// Indexes
// 1. Global unique index on email
userSchema.index({ email: 1 }, { unique: true });

// 2. Partial unique index for student enrollment number
userSchema.index(
  { enrollmentNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: 'student',
      enrollmentNumber: { $type: 'string' },
    },
  }
);

// 3. Partial unique index for faculty ID
userSchema.index(
  { facultyId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: 'faculty',
      facultyId: { $type: 'string' },
    },
  }
);

export const User = mongoose.model('User', userSchema);
export default User;
