const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Seller = require('../models/Seller');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'default-secret', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new customer
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'customer'
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Get seller info if user is a seller
    let sellerInfo = null;
    if (user.role === 'seller') {
      const seller = await Seller.findOne({ userId: user._id });
      if (seller) {
        sellerInfo = {
          businessName: seller.businessName,
          businessType: seller.businessType,
          verificationStatus: seller.verificationStatus,
          rating: seller.rating,
          trustBadges: seller.trustBadges
        };
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore,
        isVerified: user.isVerified,
        seller: sellerInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Register as seller (requires existing user account)
router.post('/register-seller', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessType').isIn(['brand', 'celebrity', 'established_business', 'verified_retailer'])
    .withMessage('Invalid business type'),
  body('description').notEmpty().withMessage('Business description is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, businessName, businessType, description, businessInfo } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user account
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({
          message: 'Name and phone are required for new accounts'
        });
      }

      user = new User({
        name,
        email,
        password,
        phone,
        role: 'seller'
      });
      await user.save();
    } else {
      // Verify password and update role
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
      user.role = 'seller';
      await user.save();
    }

    // Check if seller profile already exists
    const existingSeller = await Seller.findOne({ userId: user._id });
    if (existingSeller) {
      return res.status(400).json({ 
        message: 'Seller profile already exists',
        code: 'SELLER_EXISTS'
      });
    }

    // Create seller profile
    const seller = new Seller({
      userId: user._id,
      businessName,
      businessType,
      description,
      businessInfo: businessInfo || {},
      verificationStatus: 'pending'
    });

    await seller.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Seller registration successful. Please submit required documents for verification.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore
      },
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        verificationStatus: seller.verificationStatus,
        description: seller.description
      }
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    res.status(500).json({ 
      message: 'Seller registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;