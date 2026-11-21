import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'Message role is required'],
      enum: {
        values: ['user', 'assistant'],
        message: '{VALUE} is not a valid message role. Allowed roles: user, assistant',
      },
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message content cannot be empty'],
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required'],
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    draft: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    conversationStage: {
      type: String,
      required: [true, 'Conversation stage is required'],
      enum: {
        values: ['collecting_details', 'ready_for_review'],
        message: '{VALUE} is not a valid conversation stage. Allowed stages: collecting_details, ready_for_review',
      },
      default: 'collecting_details',
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

// Compound index to efficiently query a student's conversations ordered by most recently updated
conversationSchema.index({ studentId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
