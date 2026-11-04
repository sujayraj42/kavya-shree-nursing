'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load backend/.env regardless of whether the process is launched from root or backend/
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

/**
 * Validates required production environment variables.
 * Returns { valid: boolean, missing: string[], errors: string[] }.
 */
function validateProductionEnv(env = process.env) {
  const missing = [];
  const errors = [];

  const rawUri = env.MONGODB_URI || env.MONGO_URI || env.DATABASE_URL || '';
  if (!rawUri) {
    missing.push('MONGODB_URI');
  }
  if (!env.FRONTEND_ORIGIN) {
    missing.push('FRONTEND_ORIGIN');
  }
  if (!env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  } else if (String(env.JWT_SECRET).length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production.');
  }

  if (missing.length > 0) {
    errors.unshift(`Missing required production configuration: ${missing.join(', ')}`);
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

// Production configuration validation (strict by default in production)
if (isProduction) {
  const strictProd = process.env.STRICT_PRODUCTION_CONFIG !== 'false';
  const validation = validateProductionEnv(process.env);

  if (!validation.valid) {
    if (strictProd) {
      for (const err of validation.errors) {
        console.error(`[FATAL] Startup failure: ${err}`);
      }
      process.exit(1);
    } else {
      console.warn(
        `[WARN] Production environment validation warnings: ${validation.errors.join(' | ')}`
      );
    }
  }
}

const rawMongoUri =
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';

function resolveTrustProxy() {
  if (process.env.TRUST_PROXY !== undefined && process.env.TRUST_PROXY !== '') {
    const num = Number(process.env.TRUST_PROXY);
    if (!Number.isNaN(num)) {
      return num;
    }
    return process.env.TRUST_PROXY === 'true';
  }
  return isProduction ? 1 : false;
}

const config = {
  env: NODE_ENV,
  isProduction,
  strictProductionConfig: isProduction && process.env.STRICT_PRODUCTION_CONFIG !== 'false',
  trustProxy: resolveTrustProxy(),
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  mongodbUri: rawMongoUri || (isProduction ? '' : 'mongodb://127.0.0.1:27017/kavya_shree_nursing_dev'),
  mongodbDbName: process.env.MONGODB_DB_NAME || 'kavya_shree_nursing',
  // True only when a database URI was explicitly provided via environment.
  mongodbUriConfigured: Boolean(rawMongoUri),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  // Never fall back to a static predictable secret in production
  jwtSecret:
    process.env.JWT_SECRET ||
    (isProduction ? '' : 'dev-kavya-shree-jwt-secret-do-not-use-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  enquiryRateLimitMax: parseInt(process.env.ENQUIRY_RATE_LIMIT_MAX, 10) || 10,
  adminLoginRateLimitMax: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX, 10) || 5,
  keepAliveEnabled: process.env.KEEP_ALIVE_ENABLED !== 'false',
  keepAliveUrl: (
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (isProduction ? 'https://kavya-shree-nursing.onrender.com' : '')
  )
    .trim()
    .replace(/\/+$/, ''),
  keepAliveIntervalMs: parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 10 * 60 * 1000,
  validateProductionEnv
};

module.exports = config;
