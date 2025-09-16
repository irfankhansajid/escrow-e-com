# 🚀 Deployment Guide - Escrow E-commerce Bangladesh

## Quick Local Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### 2. Installation Steps

```bash
# Clone the repository
git clone https://github.com/irfankhansajid/escrow-e-com.git
cd escrow-e-com

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your configurations

# Start MongoDB (if local)
mongod

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

### 3. Environment Variables Required

```bash
# Essential variables for .env file
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/escrow-ecom-bd
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@escrowecombd.com
```

### 4. Test the Setup

```bash
# Health check
curl http://localhost:3000/health

# Platform info
curl http://localhost:3000/

# Available endpoints
curl http://localhost:3000/api-not-found
```

## 🌐 Production Deployment

### Option 1: Heroku Deployment

```bash
# Install Heroku CLI
# Create Heroku app
heroku create escrow-ecom-bangladesh

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-production-secret

# Deploy
git push heroku main

# Seed production database
heroku run npm run seed
```

### Option 2: Digital Ocean / AWS / GCP

1. **Server Setup**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy Application**:
   ```bash
   # Clone and setup
   git clone https://github.com/irfankhansajid/escrow-e-com.git
   cd escrow-e-com
   npm install --production
   
   # Configure environment
   cp .env.example .env
   # Edit .env with production values
   
   # Start with PM2
   pm2 start server.js --name "escrow-ecom"
   pm2 startup
   pm2 save
   ```

3. **Database Setup**:
   - Use MongoDB Atlas (recommended)
   - Or install MongoDB on server
   - Run seeding: `npm run seed`

### Option 3: Docker Deployment

```dockerfile
# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t escrow-ecom .
docker run -p 3000:3000 --env-file .env escrow-ecom
```

## 🔧 Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication

### Performance
- [ ] Set up MongoDB indexing
- [ ] Configure Redis for session storage
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Monitor memory usage

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Monitor database performance
- [ ] Set up alerts for critical issues

## 📊 Sample Accounts (After Seeding)

### Admin Access
- **Email**: admin@escrowecombd.com
- **Password**: admin123456
- **Role**: Full platform management

### Sample Customer
- **Email**: sakib@cricket.com
- **Password**: sakib123
- **Role**: Customer account

### Sample Seller
- **Email**: info@bashundharagroup.com
- **Password**: bashundhara123
- **Role**: Verified seller

## 🔍 Testing the Implementation

### API Testing
```bash
# Register new customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+8801700000000"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escrowecombd.com",
    "password": "admin123456"
  }'

# Get verified products
curl http://localhost:3000/api/products

# Get verified sellers
curl http://localhost:3000/api/sellers
```

## 🛠️ Development Commands

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
npm run seed           # Seed database with sample data
```

## 📞 Support

For deployment issues:
- 📧 Email: tech@escrowecombd.com
- 📚 Documentation: Check README.md
- 🐛 Issues: GitHub Issues tab

---

**🇧🇩 Built for Bangladesh's Digital Future**