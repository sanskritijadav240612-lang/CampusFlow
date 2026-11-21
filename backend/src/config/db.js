import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Sanitize any potential credentials if present in connection string error messages
    const sanitizedMsg = error.message ? error.message.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Unknown error';
    console.error(`MongoDB connection failure: ${sanitizedMsg}`);
    throw error;
  }
};

export const getDbStatus = () => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const stateCode = mongoose.connection.readyState;
  return {
    state: connectionStates[stateCode] || 'unknown',
    isConnected: stateCode === 1,
  };
};
