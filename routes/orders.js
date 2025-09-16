const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
// const User = require('../models/User'); // Imported for future use
const { authenticateToken, requireRole, requireVerifiedSeller } = require('../middleware/auth');

const router = express.Router();

// Create new order (customers only)
router.post('/', authenticateToken, requireRole('customer'), [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Shipping phone is required'),
  body('shippingAddress.street').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.division').notEmpty().withMessage('Shipping division is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('paymentMethod').isIn(['stripe', 'sslcommerz', 'bkash', 'nagad', 'rocket'])
    .withMessage('Invalid payment method'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, shippingAddress, paymentMethod } = req.body;

    // Validate products and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId)
        .populate({
          path: 'sellerId',
          match: { verificationStatus: 'verified', isActive: true }
        });

      if (!product || product.status !== 'active' || !product.sellerId) {
        return res.status(400).json({ 
          message: `Product ${item.productId} is not available from verified sellers`,
          code: 'PRODUCT_UNAVAILABLE'
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        productSnapshot: {
          name: product.name,
          image: product.images[0]?.url,
          sku: product.sku
        }
      });
    }

    // Calculate shipping and total (simplified for now)
    const shippingCost = subtotal > 1000 ? 0 : 60; // Free shipping over 1000 BDT
    const tax = 0; // Could implement tax calculation based on division
    const total = subtotal + shippingCost + tax;

    // Get seller ID (assuming single seller order for now)
    const firstProduct = await Product.findById(items[0].productId).populate('sellerId');
    
    // Create order
    const order = new Order({
      customerId: req.user._id,
      sellerId: firstProduct.sellerId._id,
      items: orderItems,
      pricing: {
        subtotal,
        shippingCost,
        tax,
        total,
        currency: 'BDT'
      },
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      escrow: {
        status: 'pending'
      },
      status: 'pending_payment'
    });

    await order.save();

    // Reserve stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    res.status(201).json({
      message: 'Order created successfully with escrow protection',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
        currency: order.pricing.currency,
        status: order.status,
        escrowProtection: true
      },
      trustFeatures: {
        escrowProtection: 'Your payment is held securely until delivery confirmation',
        authenticityGuarantee: 'All products are guaranteed authentic',
        returnPolicy: '30-day return guarantee',
        disputeResolution: '24/7 customer support for any issues'
      },
      nextStep: 'Complete payment to confirm your order'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get customer orders (customers only)
router.get('/my-orders', authenticateToken, requireRole('customer'), [
  query('status').optional().isIn(['pending_payment', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { customerId: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate({
        path: 'sellerId',
        select: 'businessName businessType rating trustBadges'
      })
      .populate({
        path: 'items.productId',
        select: 'name images'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      orders: orders.map(order => ({
        ...order.toObject(),
        trustStatus: {
          escrowProtection: order.escrow.status,
          canRequestRefund: canRequestRefund(order),
          disputeAvailable: order.status === 'delivered' && !order.dispute.isDisputed
        }
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seller orders (verified sellers only)
router.get('/seller-orders', authenticateToken, requireVerifiedSeller, [
  query('status').optional().isIn(['pending_payment', 'payment_confirmed', 'processing', 'shipped', 'delivered']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { sellerId: req.seller._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate({
        path: 'customerId',
        select: 'name email trustScore'
      })
      .populate({
        path: 'items.productId',
        select: 'name images sku'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      orders: orders.map(order => ({
        ...order.toObject(),
        escrowInfo: {
          status: order.escrow.status,
          canRequestRelease: order.status === 'delivered' && order.escrow.status === 'held',
          autoReleaseDate: order.escrow.autoReleaseAt
        }
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'customerId',
        select: 'name email'
      })
      .populate({
        path: 'sellerId',
        select: 'businessName businessType rating trustBadges'
      })
      .populate({
        path: 'items.productId',
        select: 'name images description'
      });

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check access permissions
    if (req.user.role === 'customer' && !order.customerId._id.equals(req.user._id)) {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || !order.sellerId._id.equals(seller._id)) {
        return res.status(403).json({ 
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }
    }

    res.json({
      order: {
        ...order.toObject(),
        trustFeatures: {
          escrowProtection: order.escrow.status,
          authenticityGuaranteed: true,
          returnWindow: getReturnWindow(order),
          disputeResolution: 'Available 24/7'
        }
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm order delivery (sellers only)
router.patch('/:id/confirm-delivery', authenticateToken, requireVerifiedSeller, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order || !order.sellerId.equals(req.seller._id)) {
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ 
        message: 'Order must be in shipped status to confirm delivery',
        code: 'INVALID_STATUS'
      });
    }

    // Update order status
    order.status = 'delivered';
    order.shipping.deliveredAt = new Date();
    
    // Set escrow auto-release (7 days after delivery)
    order.escrow.status = 'held';
    order.setEscrowAutoRelease();
    
    await order.save();

    res.json({
      message: 'Delivery confirmed. Payment will be released automatically in 7 days or when customer approves.',
      order: {
        id: order._id,
        status: order.status,
        deliveredAt: order.shipping.deliveredAt,
        escrowAutoReleaseAt: order.escrow.autoReleaseAt
      }
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({ 
      message: 'Failed to confirm delivery',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Customer approve delivery (releases escrow)
router.patch('/:id/approve-delivery', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order || !order.customerId.equals(req.user._id)) {
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'delivered' || order.escrow.status !== 'held') {
      return res.status(400).json({ 
        message: 'Order cannot be approved at this time',
        code: 'INVALID_STATUS'
      });
    }

    // Release escrow to seller
    order.escrow.status = 'released_to_seller';
    order.escrow.customerApproval = true;
    order.escrow.customerApprovalAt = new Date();
    order.escrow.releasedAt = new Date();
    order.escrow.releasedBy = req.user._id;
    
    await order.save();

    res.json({
      message: 'Delivery approved. Payment has been released to the seller.',
      order: {
        id: order._id,
        status: order.status,
        escrowStatus: order.escrow.status,
        approvedAt: order.escrow.customerApprovalAt
      }
    });
  } catch (error) {
    console.error('Approve delivery error:', error);
    res.status(500).json({ 
      message: 'Failed to approve delivery',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Request refund (customers only)
router.post('/:id/request-refund', authenticateToken, requireRole('customer'), [
  body('reason').notEmpty().withMessage('Refund reason is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason, description } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order || !order.customerId.equals(req.user._id)) {
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (!canRequestRefund(order)) {
      return res.status(400).json({ 
        message: 'Refund cannot be requested for this order',
        code: 'REFUND_NOT_ALLOWED'
      });
    }

    // Create refund request
    order.refund = {
      isRefunded: false,
      reason,
      amount: order.pricing.total,
      requestedAt: new Date()
    };

    // Add note
    order.notes.push({
      type: 'customer',
      message: `Refund requested: ${reason}. ${description || ''}`,
      createdBy: req.user._id
    });

    await order.save();

    res.json({
      message: 'Refund requested successfully. Our team will review and process it within 24 hours.',
      refund: {
        orderId: order._id,
        amount: order.refund.amount,
        reason: order.refund.reason,
        requestedAt: order.refund.requestedAt,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ 
      message: 'Failed to request refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function canRequestRefund(order) {
  const refundWindow = 30; // days
  const deliveryDate = order.shipping.deliveredAt;
  
  if (!deliveryDate) return false;
  
  const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= refundWindow && order.escrow.status === 'held';
}

function getReturnWindow(order) {
  const refundWindow = 30; // days
  const deliveryDate = order.shipping.deliveredAt;
  
  if (!deliveryDate) return null;
  
  const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, refundWindow - daysSinceDelivery);
  
  return {
    totalDays: refundWindow,
    remainingDays,
    expired: remainingDays === 0
  };
}

module.exports = router;