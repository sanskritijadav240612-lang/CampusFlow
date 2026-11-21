import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  loginFaculty,
  refreshToken,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginFacultySchema,
} from '../validators/auth.schemas.js';
import {
  studentRegisterLimiter,
  loginLimiter,
  refreshLimiter,
} from '../middleware/rateLimiters.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Student registration
router.post(
  '/student/register',
  studentRegisterLimiter,
  validate(registerStudentSchema),
  registerStudent
);

// Student login
router.post(
  '/student/login',
  loginLimiter,
  validate(loginStudentSchema),
  loginStudent
);

// Faculty login
router.post(
  '/faculty/login',
  loginLimiter,
  validate(loginFacultySchema),
  loginFaculty
);

// Refresh access token via HTTP-only cookie
router.post('/refresh', refreshLimiter, refreshToken);

// Logout session
router.post('/logout', logout);

// Get current user profile (requires valid access token)
router.get('/me', requireAuth, getCurrentUser);

export default router;
