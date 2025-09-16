const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

const requireVerifiedSeller = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ 
        message: 'Seller access required',
        code: 'SELLER_REQUIRED'
      });
    }

    const Seller = require('../models/Seller');
    const seller = await Seller.findOne({ 
      userId: req.user._id, 
      verificationStatus: 'verified',
      isActive: true 
    });

    if (!seller) {
      return res.status(403).json({ 
        message: 'Verified seller status required',
        code: 'SELLER_NOT_VERIFIED'
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Seller verification error',
      code: 'SELLER_VERIFICATION_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVerifiedSeller
};