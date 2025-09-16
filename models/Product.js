const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'electronics', 'fashion', 'beauty', 'home_garden', 'sports', 
      'books', 'health', 'jewelry', 'automotive', 'celebrity_merchandise'
    ]
  },
  subcategory: {
    type: String,
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'BDT'
  },
  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  // Product attributes
  attributes: {
    brand: String,
    model: String,
    color: String,
    size: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    }
  },
  // Authenticity and trust
  authenticityGuarantee: {
    type: Boolean,
    default: true
  },
  authenticationCertificate: String,
  authenticityCertifiedBy: String,
  // Celebrity/Brand endorsement
  endorsements: [{
    type: {
      type: String,
      enum: ['celebrity', 'brand', 'expert']
    },
    endorser: String,
    message: String,
    verifiedAt: Date
  }],
  // Shipping
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number, 
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: String,
      default: '1-2 business days'
    }
  },
  // Reviews and ratings
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
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);