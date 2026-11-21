import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
};

export const REFRESH_COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};

/**
 * Generates short-lived access JWT (15 minutes)
 */
export const generateAccessToken = (user) => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      sub: userId,
      role: user.role,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
};

/**
 * Generates longer-lived refresh JWT (7 days)
 */
export const generateRefreshToken = (user) => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
};

/**
 * Verifies access JWT with algorithm restriction
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });
};

/**
 * Verifies refresh JWT with algorithm restriction
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  });
};

/**
 * Generates SHA-256 hash of a token string
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
