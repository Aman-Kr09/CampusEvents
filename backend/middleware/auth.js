const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcampuseventsjwtkey2026');

    // Get user from database
    req.user = await User.findById(decoded.id).populate('college');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found with this token' });
    }

    if (req.user.status === 'Banned') {
      return res.status(403).json({ success: false, message: 'Your account has been banned. Access denied.' });
    }

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User context not found' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
