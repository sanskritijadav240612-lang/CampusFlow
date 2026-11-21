import bcrypt from 'bcrypt';
import User from '../models/User.js';
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
 * Authenticate faculty user via college email or facultyId
 */
export const loginFaculty = async ({ identifier, password }) => {
  const trimmed = identifier.trim();
  const normalizedEmail = trimmed.toLowerCase();

  // Find active faculty by either email or facultyId
  const user = await User.findOne({
    role: 'faculty',
    isActive: true,
    $or: [{ email: normalizedEmail }, { facultyId: trimmed }],
  }).select('+passwordHash');

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
