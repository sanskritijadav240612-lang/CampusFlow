import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Resolve valid HTTP error status code (4xx - 5xx)
  const rawStatus = (res.statusCode && res.statusCode >= 400 && res.statusCode < 600)
    ? res.statusCode
    : (err.statusCode || err.status || 500);

  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599
    ? rawStatus
    : 500;

  const isClientError = statusCode >= 400 && statusCode < 500;
  const isDevelopment = env.NODE_ENV === 'development';

  // 1. Preserve safe client error messages (4xx).
  // 2. For server errors (5xx), return only "Internal Server Error" in production.
  let message;
  if (isClientError) {
    message = err.message || 'Client Error';
  } else {
    message = isDevelopment ? (err.message || 'Internal Server Error') : 'Internal Server Error';
  }

  // 4. Ensure credentials and connection URIs are never exposed in error responses
  if (typeof message === 'string') {
    message = message.replace(/\/\/[^:]+:[^@]+@/g, '//***:***@');
  }

  const response = {
    success: false,
    message,
  };

  // 3. Show stack traces only in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
