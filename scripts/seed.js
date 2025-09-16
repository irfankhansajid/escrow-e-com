const mongoose = require('mongoose');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

// Sample data for seeding the database
const userData = [
  {
    name: 'Admin User',
    email: 'admin@escrowecombd.com',
    password: 'admin123456',
    phone: '+8801700000000',
    role: 'admin',
    isVerified: true,
    trustScore: 100
  },
  {
    name: 'Sakib Al Hasan',
    email: 'sakib@cricket.com',
    password: 'sakib123',
    phone: '+8801700000001',
    role: 'customer',
    isVerified: true,
    trustScore: 95
  },
  {
    name: 'Bashundhara Group',
    email: 'info@bashundharagroup.com',
    password: 'bashundhara123',
    phone: '+8801700000002',
    role: 'seller',
    isVerified: true,
    trustScore: 98
  }
];

const sellerData = [
  {
    businessName: 'Bashundhara Group Official',
    businessType: 'established_business',
    description: 'Leading conglomerate in Bangladesh with interests in real estate, cement, paper, and consumer goods.',
    verificationStatus: 'verified',
    verifiedAt: new Date(),
    businessInfo: {
      establishedYear: 1987,
      employeeCount: '10000+',
      annualRevenue: '1B+',
      businessAddress: {
        street: 'Bashundhara City',
        city: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1229',
        country: 'Bangladesh'
      },
      website: 'https://www.bashundharagroup.com'
    },
    trustBadges: ['verified_brand', 'top_rated', 'authentic_guarantee'],
    rating: {
      average: 4.8,
      count: 1250
    },
    totalSales: 500000,
    totalOrders: 2500,
    isActive: true,
    isPremium: true
  }
];

const productData = [
  {
    name: 'Bashundhara Tissue Box - Premium Quality',
    description: 'High-quality facial tissue made from 100% virgin pulp. Soft, absorbent, and hygienic. Perfect for home and office use.',
    category: 'home_garden',
    subcategory: 'personal_care',
    price: 150,
    originalPrice: 180,
    currency: 'BDT',
    images: [
      {
        url: 'https://example.com/tissue-box-1.jpg',
        alt: 'Bashundhara Tissue Box Front',
        isPrimary: true
      }
    ],
    stock: 1000,
    sku: 'BSH-TIS-001',
    attributes: {
      brand: 'Bashundhara',
      model: 'Premium Tissue',
      color: 'White',
      size: '2-ply, 150 sheets'
    },
    authenticityGuarantee: true,
    endorsements: [
      {
        type: 'brand',
        endorser: 'Bashundhara Group',
        message: 'Official product from Bashundhara Group',
        verifiedAt: new Date()
      }
    ],
    shipping: {
      freeShipping: true,
      processingTime: '1-2 business days'
    },
    rating: {
      average: 4.7,
      count: 345
    },
    status: 'active',
    isVerified: true,
    verifiedAt: new Date(),
    isFeatured: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow-ecom-bd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Seller.deleteMany({});
    await Product.deleteMany({});

    console.log('🧹 Cleared existing data');

    // Create users
    const users = await User.create(userData);
    console.log(`👥 Created ${users.length} users`);

    // Find the seller user and create seller profile
    const sellerUser = users.find(user => user.email === 'info@bashundharagroup.com');
    if (sellerUser) {
      sellerData[0].userId = sellerUser._id;
      const sellers = await Seller.create(sellerData);
      console.log(`🏪 Created ${sellers.length} sellers`);

      // Create products for the seller
      productData[0].sellerId = sellers[0]._id;
      const products = await Product.create(productData);
      console.log(`📦 Created ${products.length} products`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n🎯 Sample Accounts Created:');
    console.log('👑 Admin: admin@escrowecombd.com / admin123456');
    console.log('👤 Customer: sakib@cricket.com / sakib123');
    console.log('🏪 Seller: info@bashundharagroup.com / bashundhara123');
    console.log('\n💡 Trust Features:');
    console.log('✓ All sellers are verified');
    console.log('✓ Products have authenticity guarantee');
    console.log('✓ Escrow payment protection');
    console.log('✓ 30-day return policy');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedDatabase };