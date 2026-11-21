import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import * as emailService from './email.service.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../config/jwt.js';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Register a new student account
 */
export const registerStudent = async ({ name, email, enrollmentNumber, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedEnrollment = enrollmentNumber.trim();

  // Check if email is already registered
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // Check if enrollment number is already registered for a student
  const existingEnrollment = await User.findOne({
    role: 'student',
    enrollmentNumber: normalizedEnrollment,
  });
  if (existingEnrollment) {
    const error = new Error('An account with this enrollment number already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password using bcrypt with 12 salt rounds
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      enrollmentNumber: normalizedEnrollment,
      passwordHash,
      role: 'student',
      isActive: true,
    });

    return user.toJSON();
  } catch (err) {
    // Handle race-condition MongoDB duplicate key errors (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const conflictMsg =
        field === 'enrollmentNumber'
          ? 'An account with this enrollment number already exists'
          : 'An account with this email address already exists';
      const duplicateError = new Error(conflictMsg);
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw err;
  }
};

/**
 * Authenticate student user and return tokens
 */
export const loginStudent = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find active student and select passwordHash explicitly
  const user = await User.findOne({
    email: normalizedEmail,
    role: 'student',
    isActive: true,
  }).select('+passwordHash');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store SHA-256 hash of refresh token
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Step 1: Validate faculty credentials and generate/send 6-digit email OTP
 */
export const loginFaculty = async ({ identifier, password }) => {
  const trimmed = identifier.trim();
  const normalizedEmail = trimmed.toLowerCase();

  // Find active faculty by either email or facultyId
  const user = await User.findOne({
    role: 'faculty',
    isActive: true,
    $or: [{ email: normalizedEmail }, { facultyId: trimmed }],
  }).select('+passwordHash +otpHash +otpExpiresAt +otpAttempts +otpLastSentAt +otpResendCount');

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  user.otpHash = otpHash;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  user.otpResendCount = 0;
  await user.save();

  // Dispatch OTP email to faculty's verified MongoDB email address
  try {
    await emailService.sendFacultyOtpEmail({
      to: user.email,
      facultyName: user.name,
      otp: rawOtp,
    });
  } catch (emailErr) {
    console.error('Faculty OTP email dispatch error:', emailErr.message);
  }

  return {
    otpRequired: true,
    emailMasked: emailService.maskEmail(user.email),
    identifier: user.email,
  };
};

/**
 * Step 2: Validate faculty 6-digit email OTP and issue session tokens
 */
export const verifyFacultyOtp = async ({ identifier, otp }) => {
  const trimmed = identifier.trim();
  const normalizedEmail = trimmed.toLowerCase();

  const user = await User.findOne({
    role: 'faculty',
    isActive: true,
    $or: [{ email: normalizedEmail }, { facultyId: trimmed }],
  }).select('+passwordHash +otpHash +otpExpiresAt +otpAttempts +otpLastSentAt +otpResendCount');

  if (!user) {
    const error = new Error('Invalid credentials or verification session');
    error.statusCode = 401;
    throw error;
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    const error = new Error('No pending verification code found. Please sign in again.');
    error.statusCode = 400;
    throw error;
  }

  const MAX_ATTEMPTS = 5;
  if ((user.otpAttempts || 0) >= MAX_ATTEMPTS) {
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();
    const error = new Error('Maximum verification attempts exceeded. Please sign in again to request a new code.');
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > new Date(user.otpExpiresAt)) {
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();
    const error = new Error('Verification code has expired. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  const incomingOtpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (user.otpHash !== incomingOtpHash) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    const remaining = Math.max(0, MAX_ATTEMPTS - user.otpAttempts);
    const error = new Error(
      remaining > 0
        ? `Invalid verification code. ${remaining} attempt(s) remaining.`
        : 'Invalid verification code. Maximum attempts reached.'
    );
    error.statusCode = 400;
    throw error;
  }

  // Single-use: Invalidate OTP on successful verification
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.otpResendCount = 0;

  // Generate tokens only after OTP is verified
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Resend faculty 6-digit email OTP with rate limiting & cooldown
 */
export const resendFacultyOtp = async ({ identifier }) => {
  const trimmed = identifier.trim();
  const normalizedEmail = trimmed.toLowerCase();

  const user = await User.findOne({
    role: 'faculty',
    isActive: true,
    $or: [{ email: normalizedEmail }, { facultyId: trimmed }],
  }).select('+passwordHash +otpHash +otpExpiresAt +otpAttempts +otpLastSentAt +otpResendCount');

  if (!user) {
    const error = new Error('Invalid credentials or verification session');
    error.statusCode = 401;
    throw error;
  }

  const COOLDOWN_MS = 60 * 1000; // 60 seconds
  if (user.otpLastSentAt && (Date.now() - new Date(user.otpLastSentAt).getTime()) < COOLDOWN_MS) {
    const waitSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - new Date(user.otpLastSentAt).getTime())) / 1000);
    const error = new Error(`Please wait ${waitSeconds} second(s) before requesting a new code.`);
    error.statusCode = 429;
    throw error;
  }

  const MAX_RESENDS = 3;
  if ((user.otpResendCount || 0) >= MAX_RESENDS) {
    const error = new Error('Maximum resend limit reached for this session. Please sign in again.');
    error.statusCode = 400;
    throw error;
  }

  // Invalidate previous OTP and generate new 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  user.otpHash = otpHash;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0; // reset verification attempts for the newly issued OTP
  user.otpLastSentAt = new Date();
  user.otpResendCount = (user.otpResendCount || 0) + 1;
  await user.save();

  try {
    await emailService.sendFacultyOtpEmail({
      to: user.email,
      facultyName: user.name,
      otp: rawOtp,
    });
  } catch (emailErr) {
    console.error('Faculty OTP email resend error:', emailErr.message);
  }

  return {
    success: true,
    message: 'A new verification code has been sent to your registered email.',
    emailMasked: emailService.maskEmail(user.email),
  };
};

/**
 * Rotate refresh token with atomic database update
 */
export const refreshSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  if (decoded.type !== 'refresh') {
    const error = new Error('Invalid token type');
    error.statusCode = 401;
    throw error;
  }

  const presentedHash = hashToken(rawRefreshToken);

  // Generate new token pair
  const newRefreshToken = generateRefreshToken({ id: decoded.sub });
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const newExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  // Atomic conditional update against the previous hash prevents race-condition rotation
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: decoded.sub,
      isActive: true,
      refreshTokenHash: presentedHash,
      refreshTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        refreshTokenHash: newRefreshTokenHash,
        refreshTokenExpiresAt: newExpiry,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    const error = new Error('Invalid, expired, or already rotated refresh token');
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAccessToken(updatedUser);

  return {
    user: updatedUser.toJSON(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revoke stored refresh token on logout
 */
export const logoutSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    return true;
  }

  try {
    const decoded = verifyRefreshToken(rawRefreshToken);
    const presentedHash = hashToken(rawRefreshToken);

    await User.updateOne(
      {
        _id: decoded.sub,
        refreshTokenHash: presentedHash,
      },
      {
        $unset: {
          refreshTokenHash: 1,
          refreshTokenExpiresAt: 1,
        },
      }
    );
  } catch {
    // If token verification or lookup fails, proceed safely
  }

  return true;
};
