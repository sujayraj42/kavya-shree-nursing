'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { Enquiry } = require('../models/Enquiry');
const validateEnquiry = require('../middleware/validateEnquiry');
const { enquiryLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const DUPLICATE_WINDOW_MS = 60 * 1000;
const recentSubmissions = new Map();

function pruneExpiredSubmissions(now) {
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp >= DUPLICATE_WINDOW_MS) {
      recentSubmissions.delete(key);
    }
  }
}

router.post('/enquiries', enquiryLimiter, validateEnquiry, async (req, res, next) => {
  try {
    const enquiryData = req.validatedEnquiry;
    const now = Date.now();
    pruneExpiredSubmissions(now);

    const fingerprint = `${enquiryData.phone}|${enquiryData.program}|${enquiryData.name.toLowerCase()}`;
    if (recentSubmissions.has(fingerprint)) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate enquiry detected. An identical enquiry was already submitted recently.'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const existingRecent = await Enquiry.findOne({
        phone: enquiryData.phone,
        program: enquiryData.program,
        createdAt: { $gte: new Date(now - DUPLICATE_WINDOW_MS) }
      });

      if (existingRecent) {
        recentSubmissions.set(fingerprint, now);
        return res.status(409).json({
          success: false,
          error: 'Duplicate enquiry detected. An identical enquiry was already submitted recently.'
        });
      }
    }

    const savedEnquiry = await Enquiry.create(enquiryData);
    recentSubmissions.set(fingerprint, now);

    // Safe confirmation response without inventing fake email deliveries or logging personal data
    res.status(201).json({
      success: true,
      message: 'Enquiry registered successfully',
      data: {
        id: savedEnquiry.id,
        program: savedEnquiry.program,
        status: savedEnquiry.status,
        createdAt: savedEnquiry.createdAt
      }
    });
  } catch (error) {
    // If it's a MongoDB/Mongoose connection or server error, provide clean status
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({
        success: false,
        error: 'Database service temporarily unavailable. Please try again later.'
      });
    }

    next(error);
  }
});

router.clearRecentSubmissions = () => {
  recentSubmissions.clear();
};

module.exports = router;
