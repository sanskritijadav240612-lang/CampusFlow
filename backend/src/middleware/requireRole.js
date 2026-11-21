export const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient permissions.',
      });
    }

    next();
  };
};
