# 🇧🇩 Escrow E-commerce Bangladesh

**Trusted E-commerce Marketplace for Verified Brands, Celebrities, and Established Businesses**

[![Trust](https://img.shields.io/badge/Core%20Value-Trust-green.svg)](https://escrowecombd.com)
[![Refund](https://img.shields.io/badge/Core%20Value-Refund-blue.svg)](https://escrowecombd.com)
[![Authenticity](https://img.shields.io/badge/Core%20Value-Authenticity-orange.svg)](https://escrowecombd.com)

## 🎯 Vision

Create Bangladesh's most trusted e-commerce platform where customers shop with complete confidence, knowing that:
- ✅ **Every seller is manually verified**
- ✅ **All products are authentic and guaranteed**
- ✅ **Payments are protected by escrow system**
- ✅ **30-day return guarantee on all purchases**

## 🏆 Core Values

### 🛡️ **TRUST**
- Curated marketplace - **NOT open to everyone**
- Only verified brands, celebrities, and established businesses
- Manual verification process for all sellers
- Trust badges and ratings system

### 💰 **REFUND**
- Escrow payment protection on all orders
- 30-day return window for all products
- Dispute resolution system with admin mediation
- Automatic refund processing

### 🏅 **AUTHENTICITY**
- 100% authenticity guarantee on all products
- Celebrity endorsements and brand partnerships
- Authentication certificates for premium items
- Direct partnerships with official brands

## 🚀 Features

### For Customers
- **🔒 Escrow Protection**: Your payment is held securely until delivery confirmation
- **✅ Verified Sellers Only**: Shop from trusted brands, celebrities, and businesses
- **🏅 Authenticity Guarantee**: Every product is guaranteed authentic
- **🔄 Easy Returns**: 30-day return policy with full refund guarantee
- **⭐ Trust Ratings**: Transparent seller ratings and reviews
- **📱 Mobile-First Design**: Optimized for Bangladesh's mobile-first market

### For Verified Sellers
- **🎖️ Trust Badges**: Display verification status and achievements
- **💼 Professional Dashboard**: Manage products, orders, and analytics
- **🚀 Premium Placement**: Featured listings for verified sellers
- **📊 Sales Analytics**: Detailed insights and performance metrics
- **🤝 Celebrity Partnerships**: Connect with celebrities for endorsements
- **💳 Secure Payments**: Guaranteed payment after delivery confirmation

### For Administrators
- **🔍 Seller Verification**: Comprehensive verification process
- **⚖️ Dispute Resolution**: Fair and transparent dispute handling
- **📈 Platform Analytics**: Complete platform performance insights
- **🛡️ Trust Management**: Monitor and maintain platform integrity

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access control
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Express-validator for input validation
- **Payment**: Stripe + SSL Commerz (Bangladesh local)
- **File Upload**: Cloudinary integration
- **Email**: Nodemailer for notifications

## 🏁 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB running locally or MongoDB Atlas
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/irfankhansajid/escrow-e-com.git
cd escrow-e-com
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Seed the database with sample data**
```bash
npm run seed
```

6. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📧 Sample Test Accounts

After running `npm run seed`, you can use these accounts:

### 👑 Admin Account
- **Email**: admin@escrowecombd.com
- **Password**: admin123456
- **Access**: Full platform management

### 👤 Customer Account
- **Email**: sakib@cricket.com
- **Password**: sakib123
- **Access**: Shopping and order management

### 🏪 Verified Seller Account
- **Email**: info@bashundharagroup.com
- **Password**: bashundhara123
- **Access**: Product management and sales

## 🔗 API Endpoints

### 🔓 Public Endpoints

```bash
GET  /                           # Platform information
GET  /health                     # Health check
GET  /api/products               # Get verified products
GET  /api/products/:id           # Get product details
GET  /api/sellers                # Get verified sellers
GET  /api/sellers/:id            # Get seller profile
POST /api/auth/register          # Customer registration
POST /api/auth/login             # User login
```

### 🔐 Protected Endpoints

```bash
# Customer Routes
GET    /api/orders/my-orders           # Customer orders
POST   /api/orders                     # Create new order
PATCH  /api/orders/:id/approve-delivery # Approve delivery
POST   /api/orders/:id/request-refund  # Request refund

# Seller Routes
GET    /api/orders/seller-orders       # Seller orders
POST   /api/products                   # Create product
PATCH  /api/orders/:id/confirm-delivery # Confirm delivery
POST   /api/sellers/apply              # Apply to become seller

# Admin Routes
GET    /api/admin/seller-verifications    # Pending verifications
PATCH  /api/admin/seller-verifications/:id # Update verification
GET    /api/admin/statistics              # Platform statistics
GET    /api/admin/disputes                # Order disputes
PATCH  /api/admin/disputes/:id/resolve    # Resolve dispute
```

## 🛡️ Trust & Security Features

### Seller Verification Process
1. **Application Submission**: Business information and documents
2. **Document Verification**: Trade license, tax certificates, identity proof
3. **Background Check**: Business verification and risk assessment
4. **Manual Review**: Admin approval with trust badge assignment
5. **Ongoing Monitoring**: Continuous performance and trust monitoring

### Escrow Payment Protection
1. **Payment Hold**: Customer payment held in escrow
2. **Order Processing**: Seller fulfills and ships order
3. **Delivery Confirmation**: Seller marks order as delivered
4. **Customer Review**: 7-day window for customer approval
5. **Payment Release**: Automatic or manual release to seller
6. **Dispute Resolution**: Admin mediation if needed

### Authenticity Guarantee
- Direct partnerships with official brands
- Celebrity verification and endorsements
- Authentication certificates for premium items
- Zero-tolerance policy for counterfeit products
- Immediate refund for any authenticity issues

## 📊 Business Model

### Target Markets
- **🏢 Verified Brands**: Official brand stores and authorized retailers
- **⭐ Celebrities**: Exclusive merchandise and endorsed products
- **🏭 Established Businesses**: Reputable companies with proven track record
- **👥 Trusted Customers**: Quality-conscious consumers seeking authenticity

### Revenue Streams
- **Commission**: 3-8% commission on verified seller sales
- **Premium Memberships**: Enhanced features for top-tier sellers
- **Featured Listings**: Promoted product placements
- **Trust Services**: Authentication and verification services
- **Escrow Fees**: Small fee for payment protection service

### Competitive Advantages
- **Curated Marketplace**: Quality over quantity approach
- **Trust-First Model**: Escrow protection and authenticity guarantee
- **Local Focus**: Bangladesh-specific features and payment methods
- **Celebrity Partnerships**: Exclusive celebrity merchandise
- **Mobile-Optimized**: Perfect for Bangladesh's mobile-first market

## 🚀 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
npm run lint       # Run ESLint
npm run seed       # Seed database with sample data
```

### Project Structure

```
├── models/           # Database models (User, Seller, Product, Order)
├── routes/           # API routes (auth, products, sellers, orders, admin)
├── middleware/       # Authentication and validation middleware
├── controllers/      # Business logic controllers
├── utils/           # Helper functions and utilities
├── scripts/         # Database seeding and utility scripts
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
└── README.md       # This file
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📈 Monitoring & Analytics

### Key Metrics Tracked
- **Trust Score**: Overall platform trust rating
- **Seller Verification Rate**: Percentage of verified sellers
- **Customer Satisfaction**: Order completion and review ratings
- **Dispute Resolution Time**: Average time to resolve disputes
- **Authenticity Guarantee**: Success rate of authenticity claims
- **Escrow Protection**: Payment security success rate

### Platform Health
- **Uptime Monitoring**: 99.9% availability target
- **Performance Metrics**: Response time and throughput
- **Security Monitoring**: Real-time threat detection
- **Error Tracking**: Comprehensive error logging and alerting

## 🤝 Contributing

We welcome contributions from developers who share our vision of creating Bangladesh's most trusted e-commerce platform.

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Maintain security best practices
- Focus on user trust and experience

## 📞 Support & Contact

### For Customers
- 📧 Email: support@escrowecombd.com
- 📱 WhatsApp: +880 1700-000000
- 🕒 Hours: 24/7 Customer Support

### For Sellers
- 📧 Email: sellers@escrowecombd.com
- 📱 Phone: +880 1700-000001
- 🕒 Hours: 9 AM - 9 PM (Dhaka Time)

### For Partnerships
- 📧 Email: partnerships@escrowecombd.com
- 📱 Phone: +880 1700-000002

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bangladesh's entrepreneurial community
- Local brands and businesses
- Technology partners and investors
- Early adopters and beta testers
- The entire team working towards digital Bangladesh

---

**Made with ❤️ for Bangladesh's digital future**

*Building trust, one transaction at a time* 🇧🇩