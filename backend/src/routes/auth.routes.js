import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  loginFaculty,
  verifyFacultyOtp,
  resendFacultyOtp,
  refreshToken,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginFacultySchema,
  verifyFacultyOtpSchema,
  resendFacultyOtpSchema,
} from '../validators/auth.schemas.js';
import {
  studentRegisterLimiter,
  loginLimiter,
  refreshLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
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

// Faculty login - Step 1: Credentials -> Send OTP
router.post(
  '/faculty/login',
  loginLimiter,
  validate(loginFacultySchema),
  loginFaculty
);

// Faculty login - Step 2: Verify OTP -> Receive JWT + Refresh Cookie
router.post(
  '/faculty/verify-otp',
  otpVerifyLimiter,
  validate(verifyFacultyOtpSchema),
  verifyFacultyOtp
);

// Faculty login - Resend OTP (with cooldown & rate limits)
router.post(
  '/faculty/resend-otp',
  otpResendLimiter,
  validate(resendFacultyOtpSchema),
  resendFacultyOtp
);

// Refresh access token via HTTP-only cookie
router.post('/refresh', refreshLimiter, refreshToken);

// Logout session
router.post('/logout', logout);

// Get current user profile (requires valid access token)
router.get('/me', requireAuth, getCurrentUser);

export default router;
