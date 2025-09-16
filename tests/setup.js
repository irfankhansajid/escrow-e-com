// Test setup file
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/escrow-ecom-test';

// Global test timeout
jest.setTimeout(10000);