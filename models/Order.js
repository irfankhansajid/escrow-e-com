const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    productSnapshot: {
      name: String,
      image: String,
      sku: String
    }
  }],
  // Pricing breakdown
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'BDT'
    }
  },
  // Shipping information
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    division: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Bangladesh'
    }
  },
  // Order status tracking
  status: {
    type: String,
    enum: [
      'pending_payment', 
      'payment_confirmed', 
      'processing', 
      'shipped', 
      'out_for_delivery', 
      'delivered', 
      'cancelled', 
      'refunded'
    ],
    default: 'pending_payment'
  },
  // Escrow system - core trust feature
  escrow: {
    status: {
      type: String,
      enum: ['pending', 'held', 'released_to_seller', 'refunded_to_customer'],
      default: 'pending'
    },
    holdUntil: Date, // Automatically release after this date
    releaseRequested: Boolean,
    releaseRequestedAt: Date,
    customerApproval: {
      type: Boolean,
      default: false
    },
    customerApprovalAt: Date,
    autoReleaseAt: Date, // Auto-release date (usually 7 days after delivery)
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'sslcommerz', 'bkash', 'nagad', 'rocket', 'bank_transfer'],
      required: true
    },
    transactionId: String,
    paymentIntentId: String, // Stripe payment intent
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundId: String,
    refundedAt: Date
  },
  // Delivery tracking
  shipping: {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    estimatedDelivery: Date,
    deliveredAt: Date,
    deliveryNotes: String
  },
  // Customer feedback and disputes
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    reviewedAt: Date,
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    }
  },
  // Dispute and refund management
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: String,
    description: String,
    evidence: [String], // URLs to evidence files
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: String,
    createdAt: Date,
    resolvedAt: Date
  },
  // Refund information
  refund: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    reason: String,
    amount: Number,
    requestedAt: Date,
    approvedAt: Date,
    processedAt: Date,
    refundMethod: String,
    adminNotes: String
  },
  // Trust and authenticity verification
  authenticity: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: String,
    verificationCertificate: String,
    verifiedAt: Date
  },
  // Order notes and communication
  notes: [{
    type: {
      type: String,
      enum: ['customer', 'seller', 'admin', 'system']
    },
    message: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `BD${timestamp.slice(-6)}${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Set escrow auto-release date when order is delivered
orderSchema.methods.setEscrowAutoRelease = function() {
  if (this.status === 'delivered' && !this.escrow.autoReleaseAt) {
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + (process.env.ESCROW_HOLD_DAYS || 7));
    this.escrow.autoReleaseAt = releaseDate;
  }
};

// Indexes for efficient queries
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'escrow.status': 1 });
orderSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Order', orderSchema);