const jwt = require('jsonwebtoken');
const User = require('../models/User');
require("dotenv").config();


const auth = async (req, res, next) => {
  try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      console.log('Extracted token:', token);

      if (!token) {
          return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);

      const user = await User.findById(decoded.userId).select('-password');
      console.log('User found:', user);

      if (!user || !user.isActive) {
          return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = user;
      next();
  } catch (error) {
      console.error('Token verification error:', error.name, error.message);
      res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, authorize };