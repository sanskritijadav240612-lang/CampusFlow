import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = undefined;
  let data = err.data || undefined;

  const isDevelopment = env.NODE_ENV === 'development';

  // 1. Handle JSON parse syntax errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload in request body';
  }
  // 2. Handle CORS origin block errors
  else if (err.message && err.message.includes('Blocked by CORS policy')) {
    statusCode = 403;
    message = 'CORS request blocked by server policy';
  }
  // 3. Handle Mongoose invalid ObjectId CastError
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: "${err.value}" for parameter "${err.path}"`;
  }
  // 4. Handle Mongoose schema ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // 5. Handle MongoDB duplicate key error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    message = `A conflicting ${field} already exists. Duplicate values are not permitted.`;
  }
  // 6. Handle JWT authentication errors
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please refresh your session.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  // 7. Explicit status code on error object
  else if (err.statusCode || err.status) {
    const raw = err.statusCode || err.status;
    if (Number.isInteger(raw) && raw >= 400 && raw <= 599) {
      statusCode = raw;
      message = err.message || (statusCode < 500 ? 'Client Error' : 'Internal Server Error');
    }
  } else if (res.statusCode && res.statusCode >= 400 && res.statusCode < 600) {
    statusCode = res.statusCode;
    message = err.message || 'Error occurred';
  }

  // In production, never leak 5xx server internals, database drivers, or raw error messages
  if (statusCode >= 500 && !isDevelopment) {
    message = 'Internal Server Error';
  }

  // Ensure database credentials, tokens, or connection URIs are scrubbed from error messages
  if (typeof message === 'string') {
    message = message
      .replace(/\/\/[^:]+:[^@]+@/g, '//***:***@')
      .replace(/(Bearer\s+)[A-Za-z0-9-_=.]+/gi, '$1***');
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (data) {
    response.data = data;
  }

  // Expose stack traces strictly in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
