const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
// const { authenticateToken, requireRole } = require('../middleware/auth'); // Imported for future use
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all verified sellers (public)
router.get('/', [
  query('businessType').optional().isIn(['brand', 'celebrity', 'established_business', 'verified_retailer']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['rating', 'newest', 'name'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      businessType,
      page = 1,
      limit = 20,
      sortBy = 'rating'
    } = req.query;

    const query = {
      verificationStatus: 'verified',
      isActive: true
    };

    if (businessType) query.businessType = businessType;

    let sort = {};
    switch (sortBy) {
    case 'rating':
      sort = { 'rating.average': -1, 'rating.count': -1 };
      break;
    case 'newest':
      sort = { joinedAt: -1 };
      break;
    case 'name':
      sort = { businessName: 1 };
      break;
    default:
      sort = { 'rating.average': -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sellers = await Seller.find(query)
      .populate({
        path: 'userId',
        select: 'name email isVerified trustScore'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-documents -bankAccount -__v');

    const totalSellers = await Seller.countDocuments(query);
    const totalPages = Math.ceil(totalSellers / parseInt(limit));

    // Get product counts for each seller
    const sellersWithProducts = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({
          sellerId: seller._id,
          status: 'active'
        });
        
        return {
          ...seller.toObject(),
          productCount,
          trustIndicators: {
            verified: true,
            joinedDate: seller.joinedAt,
            totalOrders: seller.totalOrders,
            rating: seller.rating,
            trustBadges: seller.trustBadges
          }
        };
      })
    );

    res.json({
      sellers: sellersWithProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSellers,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      businessTypes: [
        { id: 'brand', name: 'Verified Brand', count: await Seller.countDocuments({ ...query, businessType: 'brand' }) },
        { id: 'celebrity', name: 'Celebrity', count: await Seller.countDocuments({ ...query, businessType: 'celebrity' }) },
        { id: 'established_business', name: 'Established Business', count: await Seller.countDocuments({ ...query, businessType: 'established_business' }) },
        { id: 'verified_retailer', name: 'Verified Retailer', count: await Seller.countDocuments({ ...query, businessType: 'verified_retailer' }) }
      ]
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch sellers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seller by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate({
        path: 'userId',
        select: 'name email isVerified trustScore'
      });

    if (!seller || seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(404).json({ 
        message: 'Verified seller not found',
        code: 'SELLER_NOT_FOUND'
      });
    }

    // Get seller's products
    const products = await Product.find({
      sellerId: seller._id,
      status: 'active'
    })
      .select('name price images rating totalSales')
      .sort({ 'rating.average': -1 })
      .limit(12);

    const sellerData = {
      ...seller.toObject(),
      products,
      trustIndicators: {
        verified: true,
        verifiedAt: seller.verifiedAt,
        joinedDate: seller.joinedAt,
        totalOrders: seller.totalOrders,
        totalSales: seller.totalSales,
        rating: seller.rating,
        trustBadges: seller.trustBadges,
        responseTime: '< 2 hours', // Could be calculated from actual data
        fulfillmentRate: '99%' // Could be calculated from order data
      }
    };

    // Remove sensitive information
    delete sellerData.documents;
    delete sellerData.bankAccount;

    res.json({
      seller: sellerData,
      message: 'This is a verified seller with authenticity guarantee'
    });
  } catch (error) {
    console.error('Get seller error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seller's products
router.get('/:id/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('sortBy').optional().isIn(['price_asc', 'price_desc', 'rating', 'newest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      sortBy = 'newest'
    } = req.query;

    // Verify seller exists and is verified
    const seller = await Seller.findById(req.params.id);
    if (!seller || seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(404).json({ 
        message: 'Verified seller not found',
        code: 'SELLER_NOT_FOUND'
      });
    }

    const query = {
      sellerId: seller._id,
      status: 'active'
    };

    if (category) query.category = category;

    let sort = {};
    switch (sortBy) {
    case 'price_asc':
      sort = { price: 1 };
      break;
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'rating':
      sort = { 'rating.average': -1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        rating: seller.rating,
        trustBadges: seller.trustBadges
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Apply to become a seller (authenticated users)
router.post('/apply', authenticateToken, [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessType').isIn(['brand', 'celebrity', 'established_business', 'verified_retailer'])
    .withMessage('Invalid business type'),
  body('description').notEmpty().withMessage('Business description is required'),
  body('businessInfo.establishedYear').optional().isInt({ min: 1900, max: new Date().getFullYear() }),
  body('businessInfo.website').optional().isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user already has a seller profile
    const existingSeller = await Seller.findOne({ userId: req.user._id });
    if (existingSeller) {
      return res.status(400).json({ 
        message: 'Seller application already exists',
        currentStatus: existingSeller.verificationStatus,
        code: 'SELLER_EXISTS'
      });
    }

    const { businessName, businessType, description, businessInfo } = req.body;

    // Create seller application
    const seller = new Seller({
      userId: req.user._id,
      businessName,
      businessType,
      description,
      businessInfo: businessInfo || {},
      verificationStatus: 'pending'
    });

    await seller.save();

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'seller' });

    res.status(201).json({
      message: 'Seller application submitted successfully. Please upload required documents for verification.',
      application: {
        id: seller._id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        verificationStatus: seller.verificationStatus,
        requiredDocuments: getRequiredDocuments(businessType)
      }
    });
  } catch (error) {
    console.error('Seller application error:', error);
    res.status(500).json({ 
      message: 'Failed to submit seller application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trust statistics (public)
router.get('/meta/trust-stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      Seller.countDocuments({ verificationStatus: 'verified', isActive: true }),
      Seller.countDocuments({ businessType: 'brand', verificationStatus: 'verified', isActive: true }),
      Seller.countDocuments({ businessType: 'celebrity', verificationStatus: 'verified', isActive: true }),
      Seller.countDocuments({ businessType: 'established_business', verificationStatus: 'verified', isActive: true }),
      Seller.aggregate([
        { $match: { verificationStatus: 'verified', isActive: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
      ])
    ]);

    res.json({
      trustStats: {
        totalVerifiedSellers: stats[0],
        verifiedBrands: stats[1],
        celebrities: stats[2],
        establishedBusinesses: stats[3],
        averageSellerRating: stats[4][0]?.avgRating || 0,
        trustGuarantees: [
          'All sellers are manually verified',
          'Authenticity guaranteed on all products',
          'Escrow payment protection',
          '30-day return policy',
          'Dispute resolution system'
        ]
      },
      message: 'Bangladesh\'s most trusted e-commerce platform'
    });
  } catch (error) {
    console.error('Trust stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trust statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to get required documents based on business type
function getRequiredDocuments(businessType) {
  const documents = {
    brand: ['trade_license', 'tax_certificate', 'brand_authorization', 'identity_proof'],
    celebrity: ['identity_proof', 'celebrity_verification', 'tax_certificate'],
    established_business: ['trade_license', 'tax_certificate', 'identity_proof'],
    verified_retailer: ['trade_license', 'tax_certificate', 'identity_proof']
  };
  
  return documents[businessType] || ['trade_license', 'tax_certificate', 'identity_proof'];
}

module.exports = router;