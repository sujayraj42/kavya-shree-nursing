'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Express proxy trust: configurable via TRUST_PROXY (defaults to 1 in production behind Render)
if (config.trustProxy !== false) {
  app.set('trust proxy', config.trustProxy);
}

// Security HTTP headers
app.use(helmet());

const VERCEL_PROJECT_ORIGIN_REGEX = /^https:\/\/kavya-shree-nursing(-[a-z0-9-]+)?\.vercel\.app$/i;

// CORS configuration: restricted to FRONTEND_ORIGIN and project Vercel previews in production
const corsOptions = {
  origin: function (origin, callback) {
    if (config.isProduction && process.env.FRONTEND_ORIGIN) {
      const allowedOrigins = config.frontendOrigin
        .split(',')
        .map(o => o.trim().replace(/\/+$/, '').toLowerCase());

      const normalizedOrigin = (origin || '').replace(/\/+$/, '').toLowerCase();

      // Allow same-origin / server-to-server (no Origin header), configured origins, or project Vercel preview URLs
      if (
        !origin ||
        allowedOrigins.includes(normalizedOrigin) ||
        VERCEL_PROJECT_ORIGIN_REGEX.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      const corsError = new Error('CORS blocked: Request origin not authorized');
      corsError.status = 403;
      return callback(corsError);
    }

    // Allow same-origin and non-restricted requests in development/test
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Request body payload limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Global rate limiting on API endpoints
app.use('/api', globalLimiter);

// API Routes
app.use('/api', healthRoutes);
app.use('/api', enquiryRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
