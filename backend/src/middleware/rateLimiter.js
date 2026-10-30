'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

const enquiryLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.enquiryRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many enquiry submissions from this IP, please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.adminLoginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

module.exports = {
  globalLimiter,
  enquiryLimiter,
  loginLimiter
};
