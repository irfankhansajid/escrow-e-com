const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(authenticateToken, requireRole('admin'));

// Get pending seller verifications
router.get('/seller-verifications', [
  query('status').optional().isIn(['pending', 'under_review', 'verified', 'rejected']),
  query('businessType').optional().isIn(['brand', 'celebrity', 'established_business', 'verified_retailer']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
      status = 'pending',
      businessType,
      page = 1,
      limit = 20
    } = req.query;

    const query = { verificationStatus: status };
    if (businessType) query.businessType = businessType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sellers = await Seller.find(query)
      .populate({
        path: 'userId',
        select: 'name email phone createdAt'
      })
      .sort({ createdAt: 1 }) // Oldest first for fairness
      .skip(skip)
      .limit(parseInt(limit));

    const totalSellers = await Seller.countDocuments(query);

    res.json({
      sellers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSellers / parseInt(limit)),
        totalSellers,
        limit: parseInt(limit)
      },
      summary: {
        pending: await Seller.countDocuments({ verificationStatus: 'pending' }),
        underReview: await Seller.countDocuments({ verificationStatus: 'under_review' }),
        verified: await Seller.countDocuments({ verificationStatus: 'verified' }),
        rejected: await Seller.countDocuments({ verificationStatus: 'rejected' })
      }
    });
  } catch (error) {
    console.error('Get seller verifications error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller verifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seller verification details
router.get('/seller-verifications/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate({
        path: 'userId',
        select: 'name email phone address trustScore createdAt'
      });

    if (!seller) {
      return res.status(404).json({ 
        message: 'Seller not found',
        code: 'SELLER_NOT_FOUND'
      });
    }

    res.json({
      seller,
      verificationChecklist: generateVerificationChecklist(seller),
      riskAssessment: await generateRiskAssessment(seller)
    });
  } catch (error) {
    console.error('Get seller verification details error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller verification details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update seller verification status
router.patch('/seller-verifications/:id', [
  body('status').isIn(['under_review', 'verified', 'rejected']).withMessage('Invalid verification status'),
  body('notes').optional().isString(),
  body('rejectionReason').if(body('status').equals('rejected')).notEmpty().withMessage('Rejection reason required'),
  body('trustBadges').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, notes, rejectionReason, trustBadges } = req.body;
    
    const seller = await Seller.findById(req.params.id)
      .populate('userId', 'name email');

    if (!seller) {
      return res.status(404).json({ 
        message: 'Seller not found',
        code: 'SELLER_NOT_FOUND'
      });
    }

    // Update seller verification
    seller.verificationStatus = status;
    
    if (status === 'verified') {
      seller.verifiedAt = new Date();
      seller.verifiedBy = req.user._id;
      seller.isActive = true;
      
      // Assign trust badges
      if (trustBadges && trustBadges.length > 0) {
        seller.trustBadges = trustBadges;
      }

      // Update user trust score
      await User.findByIdAndUpdate(seller.userId._id, {
        $inc: { trustScore: 50 }, // Bonus for verification
        isVerified: true
      });
    }

    if (status === 'rejected') {
      seller.rejectionReason = rejectionReason;
      seller.isActive = false;
    }

    // Add admin note
    if (notes) {
      seller.adminNotes = seller.adminNotes || [];
      seller.adminNotes.push({
        note: notes,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    await seller.save();

    // Send notification email (would implement email service)
    const notification = {
      to: seller.userId.email,
      subject: `Seller Verification ${status === 'verified' ? 'Approved' : 'Update'}`,
      template: status === 'verified' ? 'seller_approved' : 'seller_status_update',
      data: {
        businessName: seller.businessName,
        status,
        notes,
        rejectionReason
      }
    };

    res.json({
      message: `Seller verification ${status} successfully`,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        verificationStatus: seller.verificationStatus,
        verifiedAt: seller.verifiedAt,
        trustBadges: seller.trustBadges
      },
      notification
    });
  } catch (error) {
    console.error('Update seller verification error:', error);
    res.status(500).json({ 
      message: 'Failed to update seller verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get platform statistics
router.get('/statistics', async (req, res) => {
  try {
    const [
      userStats,
      sellerStats,
      productStats,
      orderStats,
      revenueStats
    ] = await Promise.all([
      // User statistics
      Promise.all([
        User.countDocuments({ role: 'customer', isActive: true }),
        User.countDocuments({ role: 'seller', isActive: true }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
      ]),
      // Seller statistics
      Promise.all([
        Seller.countDocuments({ verificationStatus: 'verified', isActive: true }),
        Seller.countDocuments({ verificationStatus: 'pending' }),
        Seller.countDocuments({ businessType: 'brand', verificationStatus: 'verified' }),
        Seller.countDocuments({ businessType: 'celebrity', verificationStatus: 'verified' })
      ]),
      // Product statistics
      Promise.all([
        Product.countDocuments({ status: 'active' }),
        Product.countDocuments({ isVerified: true, status: 'active' }),
        Product.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
        Product.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ])
      ]),
      // Order statistics
      Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'delivered' }),
        Order.countDocuments({ 'escrow.status': 'held' }),
        Order.countDocuments({ 'refund.isRefunded': true })
      ]),
      // Revenue statistics (would need actual payment integration)
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { 
          _id: null, 
          totalRevenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' }
        }}
      ])
    ]);

    res.json({
      users: {
        totalCustomers: userStats[0],
        totalSellers: userStats[1],
        totalAdmins: userStats[2],
        newUsersThisMonth: userStats[3]
      },
      sellers: {
        totalVerified: sellerStats[0],
        pendingVerification: sellerStats[1],
        verifiedBrands: sellerStats[2],
        celebrities: sellerStats[3]
      },
      products: {
        totalActive: productStats[0],
        totalVerified: productStats[1],
        newThisMonth: productStats[2],
        averagePrice: productStats[3][0]?.avgPrice || 0
      },
      orders: {
        total: orderStats[0],
        delivered: orderStats[1],
        escrowHeld: orderStats[2],
        refunded: orderStats[3]
      },
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        averageOrderValue: revenueStats[0]?.avgOrderValue || 0,
        currency: 'BDT'
      },
      trustMetrics: {
        verificationRate: sellerStats[0] / (sellerStats[0] + sellerStats[1]) * 100,
        escrowProtectionRate: 100, // All orders have escrow protection
        refundRate: orderStats[3] / orderStats[0] * 100
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch platform statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get dispute orders
router.get('/disputes', [
  query('status').optional().isIn(['open', 'under_review', 'resolved', 'closed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { 'dispute.isDisputed': true };
    if (status) query['dispute.status'] = status;

    const disputes = await Order.find(query)
      .populate('customerId', 'name email')
      .populate('sellerId', 'businessName businessType rating')
      .populate('items.productId', 'name images')
      .sort({ 'dispute.createdAt': 1 }) // Oldest first
      .skip(skip)
      .limit(parseInt(limit));

    const totalDisputes = await Order.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDisputes / parseInt(limit)),
        totalDisputes,
        limit: parseInt(limit)
      },
      summary: {
        open: await Order.countDocuments({ 'dispute.status': 'open' }),
        underReview: await Order.countDocuments({ 'dispute.status': 'under_review' }),
        resolved: await Order.countDocuments({ 'dispute.status': 'resolved' }),
        closed: await Order.countDocuments({ 'dispute.status': 'closed' })
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Resolve dispute
router.patch('/disputes/:orderId/resolve', [
  body('resolution').notEmpty().withMessage('Resolution is required'),
  body('refundAmount').optional().isFloat({ min: 0 }),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { resolution, refundAmount, adminNotes } = req.body;
    
    const order = await Order.findById(req.params.orderId)
      .populate('customerId', 'name email')
      .populate('sellerId', 'businessName businessType');

    if (!order || !order.dispute.isDisputed) {
      return res.status(404).json({ 
        message: 'Disputed order not found',
        code: 'DISPUTE_NOT_FOUND'
      });
    }

    // Update dispute
    order.dispute.status = 'resolved';
    order.dispute.resolution = resolution;
    order.dispute.resolvedBy = req.user._id;
    order.dispute.resolvedAt = new Date();

    // Handle refund if specified
    if (refundAmount > 0) {
      order.refund = {
        isRefunded: true,
        reason: 'Admin dispute resolution',
        amount: refundAmount,
        requestedAt: new Date(),
        approvedAt: new Date(),
        processedAt: new Date(),
        adminNotes
      };
      order.escrow.status = 'refunded_to_customer';
    } else {
      // Release to seller
      order.escrow.status = 'released_to_seller';
      order.escrow.releasedAt = new Date();
      order.escrow.releasedBy = req.user._id;
    }

    // Add admin note
    order.notes.push({
      type: 'admin',
      message: `Dispute resolved: ${resolution}${adminNotes ? ` Notes: ${adminNotes}` : ''}`,
      createdBy: req.user._id
    });

    await order.save();

    res.json({
      message: 'Dispute resolved successfully',
      resolution: {
        orderId: order._id,
        resolution,
        refundAmount: refundAmount || 0,
        escrowStatus: order.escrow.status,
        resolvedAt: order.dispute.resolvedAt
      }
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ 
      message: 'Failed to resolve dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function generateVerificationChecklist(seller) {
  return {
    businessInfo: {
      complete: !!(seller.businessName && seller.businessType && seller.description),
      required: ['businessName', 'businessType', 'description']
    },
    documents: {
      submitted: seller.documents.length,
      required: getRequiredDocuments(seller.businessType).length,
      approved: seller.documents.filter(doc => doc.status === 'approved').length
    },
    bankAccount: {
      provided: !!(seller.bankAccount && seller.bankAccount.accountNumber),
      verified: seller.bankAccount?.isVerified || false
    },
    businessAddress: {
      complete: !!(seller.businessInfo?.businessAddress?.street && 
                  seller.businessInfo?.businessAddress?.city &&
                  seller.businessInfo?.businessAddress?.division)
    }
  };
}

async function generateRiskAssessment(seller) {
  const riskFactors = {
    newSeller: (Date.now() - seller.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000), // Less than 30 days
    incompleteProfile: !seller.businessInfo?.establishedYear,
    missingWebsite: !seller.businessInfo?.website,
    noSocialMedia: !(seller.businessInfo?.socialMedia?.facebook || 
                    seller.businessInfo?.socialMedia?.instagram)
  };

  const riskScore = Object.values(riskFactors).filter(Boolean).length;
  
  return {
    score: riskScore,
    level: riskScore >= 3 ? 'high' : riskScore >= 2 ? 'medium' : 'low',
    factors: Object.keys(riskFactors).filter(key => riskFactors[key]),
    recommendations: generateRecommendations(riskFactors, seller)
  };
}

function generateRecommendations(riskFactors, seller) {
  const recommendations = [];
  
  if (riskFactors.newSeller) {
    recommendations.push('Monitor closely for first 3 months');
  }
  
  if (riskFactors.incompleteProfile) {
    recommendations.push('Request additional business information');
  }
  
  if (riskFactors.missingWebsite) {
    recommendations.push('Verify business through alternative channels');
  }
  
  if (seller.businessType === 'celebrity') {
    recommendations.push('Require additional identity verification for celebrity status');
  }
  
  return recommendations;
}

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