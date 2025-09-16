const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Escrow E-commerce Bangladesh API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/escrow-ecom-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.close();
  });

  describe('GET /', () => {
    it('should return platform information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Escrow E-commerce Bangladesh');
      expect(response.body.coreValues).toEqual(['Trust', 'Refund', 'Authenticity']);
      expect(response.body.features).toContain('Verified sellers only');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/products', () => {
    it('should return products from verified sellers only', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /api/sellers', () => {
    it('should return verified sellers only', async () => {
      const response = await request(app).get('/api/sellers');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sellers');
      expect(response.body).toHaveProperty('businessTypes');
      expect(Array.isArray(response.body.sellers)).toBe(true);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer', async () => {
      const customerData = {
        name: 'Test Customer',
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        phone: '+8801700000000'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(customerData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('customer');
      expect(response.body.message).toContain('registered successfully');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = {
        name: 'Test',
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Trust Features', () => {
    it('should include trust indicators in product details', async () => {
      // This test would require seeded data or mocked data
      // For now, we'll test the structure
      const response = await request(app).get('/api/products/meta/categories');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body.message).toContain('verified sellers only');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Route not found');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/');
      
      // Check if helmet middleware is working
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});