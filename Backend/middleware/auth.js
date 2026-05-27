const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');

// Verify JWT and attach user to req
exports.protect = async (req, res, next) => {
  try {
    let token;
    const auth = req.headers.authorization;

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    }

    if (!token) return error(res, 'Authentication required', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (!user || !user.isActive) return error(res, 'User not found or inactive', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return error(res, 'Invalid token', 401);
    if (err.name === 'TokenExpiredError') return error(res, 'Token expired', 401);
    return error(res, 'Authentication failed', 500);
  }
};

// Role-based access control
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
};