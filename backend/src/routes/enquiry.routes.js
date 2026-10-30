'use strict';

const express = require('express');
const { Enquiry } = require('../models/Enquiry');
const validateEnquiry = require('../middleware/validateEnquiry');
const { enquiryLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/enquiries', enquiryLimiter, validateEnquiry, async (req, res, next) => {
  try {
    const enquiryData = req.validatedEnquiry;

    const savedEnquiry = await Enquiry.create(enquiryData);

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

module.exports = router;
