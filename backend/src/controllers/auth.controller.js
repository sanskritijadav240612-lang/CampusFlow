import * as authService from '../services/auth.service.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_COOKIE_CLEAR_OPTIONS,
} from '../config/jwt.js';

/**
 * Student registration
 */
export const registerStudent = async (req, res, next) => {
  try {
    const user = await authService.registerStudent(req.body);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student login
 */
export const loginStudent = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginStudent(req.body);

    // Store raw refresh token strictly in HTTP-only cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Student logged in successfully',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty login - Step 1: Validates credentials and sends 6-digit OTP to registered faculty email
 * CRITICAL: Does NOT issue access token or refresh cookie
 */
export const loginFaculty = async (req, res, next) => {
  try {
    const result = await authService.loginFaculty(req.body);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to registered faculty email.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty login - Step 2: Validates 6-digit OTP and establishes session
 */
export const verifyFacultyOtp = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.verifyFacultyOtp(req.body);

    // Store raw refresh token strictly in HTTP-only cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Faculty authenticated successfully',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty login - Resend 6-digit OTP with 60s cooldown
 */
export const resendFacultyOtp = async (req, res, next) => {
  try {
    const result = await authService.resendFacultyOtp(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Token refresh and rotation
 */
export const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided in cookie',
      });
    }

    const { user, accessToken, refreshToken: newRefreshToken } =
      await authService.refreshSession(rawRefreshToken);

    // Set updated refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    // Clear cookie on any refresh verification failure
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
    next(error);
  }
};

/**
 * Logout session and clear cookie
 */
export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];

    if (rawRefreshToken) {
      await authService.logoutSession(rawRefreshToken);
    }

    // Always clear the refresh cookie on logout
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
    next(error);
  }
};

/**
 * Get currently authenticated user profile
 */
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};
