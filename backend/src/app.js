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

// Express proxy trust: trust first proxy when deployed behind Render / reverse proxy
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Security HTTP headers
app.use(helmet());

// CORS configuration: restricted to FRONTEND_ORIGIN when explicitly configured in production
const corsOptions = {
  origin: function (origin, callback) {
    if (config.isProduction && process.env.FRONTEND_ORIGIN) {
      const allowedOrigins = config.frontendOrigin
        .split(',')
        .map(o => o.trim().replace(/\/+$/, '').toLowerCase());

      const normalizedOrigin = (origin || '').replace(/\/+$/, '').toLowerCase();

      // If no origin (same-origin / server-to-server) or matches configured origin or Vercel preview
      if (
        !origin ||
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      const corsError = new Error('CORS blocked: Request origin not authorized');
      corsError.status = 403;
      return callback(corsError);
    }

    // Allow same-origin and non-restricted requests
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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
