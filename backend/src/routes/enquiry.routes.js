'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { Enquiry } = require('../models/Enquiry');
const validateEnquiry = require('../middleware/validateEnquiry');
const { enquiryLimiter } = require('../middleware/rateLimiter');
const { notifyNewEnquiry } = require('../services/automation.service');
const { cacheService } = require('../services/cache.service');
const { createSubmissionDeduplicator } = require('../utils/common');

const router = express.Router();

const DUPLICATE_WINDOW_MS = 60 * 1000;
const enquiryDeduplicator = createSubmissionDeduplicator(DUPLICATE_WINDOW_MS, 500);

router.get('/enquiries', (req, res) => {
  res.status(200).json({
    success: true,
    endpoint: '/api/enquiries',
    description: 'Kavya Shree Institute Admissions Enquiry API',
    usage: {
      submitEnquiry: 'POST /api/enquiries',
      adminWorkspace: 'GET /api/admin/enquiries (Requires Bearer token)'
    }
  });
});

router.post('/enquiries', enquiryLimiter, validateEnquiry, async (req, res, next) => {
  try {
    const enquiryData = req.validatedEnquiry;
    const now = Date.now();

    const fingerprint = `${enquiryData.phone}|${enquiryData.program}|${enquiryData.name.toLowerCase()}`;
    if (enquiryDeduplicator.isDuplicate(fingerprint, now)) {
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
        enquiryDeduplicator.record(fingerprint, now);
        return res.status(409).json({
          success: false,
          error: 'Duplicate enquiry detected. An identical enquiry was already submitted recently.'
        });
      }
    }

    const savedEnquiry = await Enquiry.create(enquiryData);
    enquiryDeduplicator.record(fingerprint, now);
    cacheService.invalidateStats().catch(() => {});

    notifyNewEnquiry(savedEnquiry);

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
  enquiryDeduplicator.clear();
};

module.exports = router;
