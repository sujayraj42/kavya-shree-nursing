'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load backend/.env regardless of whether the process is launched from root or backend/
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Production configuration validation
if (isProduction) {
  const missing = [];
  if (!process.env.MONGODB_URI) {
    missing.push('MONGODB_URI');
  }
  if (!process.env.FRONTEND_ORIGIN) {
    missing.push('FRONTEND_ORIGIN');
  }
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    console.error(
      `[FATAL] Startup failure: Missing required production configuration: ${missing.join(', ')}`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] Startup failure: JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }
}

const config = {
  env: NODE_ENV,
  isProduction,
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kavya_shree_nursing_dev',
  // True only when a database URI was explicitly provided via environment.
  mongodbUriConfigured: Boolean(process.env.MONGODB_URI),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || 'dev-kavya-shree-jwt-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  enquiryRateLimitMax: parseInt(process.env.ENQUIRY_RATE_LIMIT_MAX, 10) || 10,
  adminLoginRateLimitMax: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX, 10) || 5
};

module.exports = config;
