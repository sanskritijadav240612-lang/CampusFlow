import { verifyAccessToken } from '../config/jwt.js';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No access token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.',
      });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or has been disabled.',
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      enrollmentNumber: user.enrollmentNumber || null,
      facultyId: user.facultyId || null,
      isActive: user.isActive,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your session.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid access token.',
    });
  }
};
