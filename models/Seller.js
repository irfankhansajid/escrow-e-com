const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['brand', 'celebrity', 'established_business', 'verified_retailer'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Business documents for verification
  documents: [{
    type: {
      type: String,
      enum: ['trade_license', 'tax_certificate', 'identity_proof', 'celebrity_verification', 'brand_authorization'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Business details
  businessInfo: {
    establishedYear: Number,
    employeeCount: String,
    annualRevenue: String,
    businessAddress: {
      street: String,
      city: String,
      division: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Bangladesh'
      }
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      youtube: String
    }
  },
  // Trust and performance metrics
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  trustBadges: [{
    type: String,
    enum: ['verified_brand', 'celebrity_endorsed', 'top_rated', 'fast_shipping', 'authentic_guarantee']
  }],
  // Financial information
  bankAccount: {
    accountNumber: String,
    routingNumber: String,
    bankName: String,
    accountHolderName: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  // Sales metrics
  totalSales: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
sellerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
sellerSchema.index({ verificationStatus: 1, isActive: 1 });
sellerSchema.index({ businessType: 1, verificationStatus: 1 });
sellerSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Seller', sellerSchema);