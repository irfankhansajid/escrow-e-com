const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { authenticateToken, requireVerifiedSeller } = require('../middleware/auth');

const router = express.Router();

// Get all verified products (public)
router.get('/', [
  query('category').optional().isString(),
  query('subcategory').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['price_asc', 'price_desc', 'rating', 'newest', 'popular']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('verified').optional().isBoolean()
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
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      sortBy = 'newest',
      page = 1,
      limit = 20,
      verified = true
    } = req.query;

    // Build query
    const query = {
      status: 'active'
    };

    // Only show products from verified sellers by default
    if (verified === true || verified === 'true') {
      const verifiedSellers = await Seller.find({ 
        verificationStatus: 'verified',
        isActive: true 
      }).select('_id');
      query.sellerId = { $in: verifiedSellers.map(s => s._id) };
    }

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
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
    case 'popular':
      sort = { views: -1, totalSales: -1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate({
        path: 'sellerId',
        select: 'businessName businessType rating trustBadges verificationStatus',
        match: { verificationStatus: 'verified', isActive: true }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Filter out products where seller population failed
    const validProducts = products.filter(product => product.sellerId);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products: validProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        category,
        subcategory,
        minPrice,
        maxPrice,
        search,
        sortBy
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'sellerId',
        select: 'businessName businessType rating trustBadges verificationStatus businessInfo'
      });

    if (!product || product.status !== 'active') {
      return res.status(404).json({ 
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Only show products from verified sellers
    if (!product.sellerId || product.sellerId.verificationStatus !== 'verified') {
      return res.status(404).json({ 
        message: 'Product not available',
        code: 'PRODUCT_UNAVAILABLE'
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      product,
      trustIndicators: {
        verifiedSeller: true,
        authenticityGuarantee: product.authenticityGuarantee,
        returnPolicy: '30-day return guarantee',
        escrowProtection: true,
        sellerRating: product.sellerId.rating,
        trustBadges: product.sellerId.trustBadges
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new product (verified sellers only)
router.post('/', authenticateToken, requireVerifiedSeller, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('category').isIn([
    'electronics', 'fashion', 'beauty', 'home_garden', 'sports', 
    'books', 'health', 'jewelry', 'automotive', 'celebrity_merchandise'
  ]).withMessage('Invalid category'),
  body('subcategory').notEmpty().withMessage('Subcategory is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('images').isArray({ min: 1 }).withMessage('At least one product image is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      sellerId: req.seller._id,
      isVerified: false, // Admin approval required
      authenticityGuarantee: true // All products have authenticity guarantee
    };

    // Generate SKU if not provided
    if (!productData.sku) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      productData.sku = `${req.seller.businessType.toUpperCase()}-${timestamp}${random}`;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully. It will be available after verification.',
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        status: product.status,
        isVerified: product.isVerified
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product with this SKU already exists',
        code: 'DUPLICATE_SKU'
      });
    }
    res.status(500).json({ 
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get categories (public)
router.get('/meta/categories', (req, res) => {
  const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      subcategories: ['smartphones', 'laptops', 'tablets', 'headphones', 'cameras', 'gaming']
    },
    {
      id: 'fashion',
      name: 'Fashion',
      subcategories: ['mens_clothing', 'womens_clothing', 'shoes', 'bags', 'accessories', 'watches']
    },
    {
      id: 'beauty',
      name: 'Beauty & Personal Care',
      subcategories: ['skincare', 'makeup', 'fragrance', 'hair_care', 'personal_care']
    },
    {
      id: 'home_garden',
      name: 'Home & Garden',
      subcategories: ['furniture', 'home_decor', 'kitchen', 'garden', 'appliances']
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      subcategories: ['cricket', 'football', 'fitness', 'outdoor', 'sportswear']
    },
    {
      id: 'books',
      name: 'Books',
      subcategories: ['fiction', 'non_fiction', 'academic', 'children', 'bengali_literature']
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      subcategories: ['vitamins', 'supplements', 'medical', 'ayurveda', 'fitness']
    },
    {
      id: 'jewelry',
      name: 'Jewelry',
      subcategories: ['gold', 'silver', 'diamond', 'traditional', 'fashion_jewelry']
    },
    {
      id: 'automotive',
      name: 'Automotive',
      subcategories: ['car_accessories', 'bike_accessories', 'parts', 'tools']
    },
    {
      id: 'celebrity_merchandise',
      name: 'Celebrity Merchandise',
      subcategories: ['signed_items', 'exclusive_products', 'limited_edition', 'collectibles']
    }
  ];

  res.json({
    categories,
    message: 'All categories are curated for verified sellers only'
  });
});

// Get featured products (public)
router.get('/featured/products', async (req, res) => {
  try {
    const featuredProducts = await Product.find({
      status: 'active',
      isFeatured: true
    })
      .populate({
        path: 'sellerId',
        select: 'businessName businessType rating trustBadges',
        match: { verificationStatus: 'verified', isActive: true }
      })
      .sort({ 'rating.average': -1, views: -1 })
      .limit(12)
      .select('-__v');

    const validProducts = featuredProducts.filter(product => product.sellerId);

    res.json({
      featuredProducts: validProducts,
      message: 'Featured products from verified sellers only'
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch featured products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;