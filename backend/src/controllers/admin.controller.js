'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { Admin } = require('../models/Admin');
const { Enquiry, VALID_STATUSES, ALL_ALLOWED_STATUSES, normalizeStatus } = require('../models/Enquiry');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pre-computed hash used to equalise response timing when an email is unknown,
// so login latency does not reveal which administrator emails exist.
const TIMING_EQUALISATION_HASH = bcrypt.hashSync('timing-equalisation-placeholder', 12);

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Administrator login handler.
 * Validates credentials, updates login timestamp, and issues signed JWT.
 * Returns generic failures to avoid account enumeration.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password format'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    const admin = await Admin.findOne({ email: trimmedEmail });
    if (!admin) {
      // Run a dummy comparison so timing matches the wrong-password path
      await bcrypt.compare(password, TIMING_EQUALISATION_HASH);
      // Generic error: do not disclose that account does not exist
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (admin.isActive === false) {
      return res.status(401).json({
        success: false,
        error: 'Administrator account is inactive or disabled'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      // Generic error: do not disclose password mismatch
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign(
      {
        id: admin.id || admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      admin: {
        id: admin.id || admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns current authenticated admin profile.
 */
async function getMe(req, res) {
  res.status(200).json({
    success: true,
    admin: req.admin
  });
}

/**
 * Returns paginated enquiry list with optional filters and safe regex search.
 */
async function listEnquiries(req, res, next) {
  try {
    const { status, program, search } = req.query;

    const query = {};

    if (status && typeof status === 'string' && status.trim()) {
      const trimmedStatus = status.trim().toLowerCase();
      if (ALL_ALLOWED_STATUSES.includes(trimmedStatus)) {
        query.status = trimmedStatus;
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid status filter. Must be one of: ${ALL_ALLOWED_STATUSES.join(', ')}`
        });
      }
    }

    if (program && typeof program === 'string' && program.trim()) {
      query.program = program.trim();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchClean = search.trim().slice(0, 100);
      const escaped = escapeRegex(searchClean);
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, enquiries] = await Promise.all([
      Enquiry.countDocuments(query),
      Enquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: {
        enquiries,
        pagination: {
          total,
          page,
          limit,
          pages
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns single enquiry by ID including internal notes.
 */
async function getEnquiryById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid enquiry ID format'
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates status of an enquiry.
 * Strictly enforces valid active status enum.
 */
async function updateEnquiryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid enquiry ID format'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Enquiry status is required'
      });
    }

    const normalizedStatus = status.trim().toLowerCase();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }

    enquiry.status = normalizedStatus;
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: {
        id: enquiry.id || enquiry._id.toString(),
        status: enquiry.status,
        updatedAt: enquiry.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Appends an internal staff note to an enquiry.
 * Server derives author strictly from authenticated admin identity.
 */
async function addEnquiryNote(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid enquiry ID format'
      });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Note text cannot be empty'
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Note text must not exceed 1000 characters'
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }

    // Author is bound from authenticated admin token; client-supplied author is ignored
    const author = req.admin.name || req.admin.email || 'Administrator';

    enquiry.notes.push({
      author,
      text: trimmedText
    });

    await enquiry.save();

    const createdNote = enquiry.notes[enquiry.notes.length - 1];

    res.status(201).json({
      success: true,
      message: 'Internal note added successfully',
      data: createdNote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns aggregated statistics for admin dashboard using MongoDB aggregation.
 */
async function getDashboardStats(req, res, next) {
  try {
    const [statusAggregation, total, recentEnquiries] = await Promise.all([
      Enquiry.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Enquiry.countDocuments(),
      Enquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const stats = {
      total,
      new: 0,
      contacted: 0,
      in_review: 0,
      admitted: 0,
      closed: 0,
      archived: 0
    };

    if (Array.isArray(statusAggregation)) {
      for (const item of statusAggregation) {
        const normalized = normalizeStatus(item._id);
        if (stats[normalized] !== undefined) {
          stats[normalized] += item.count;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentEnquiries
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  getDashboardStats,
  listEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  addEnquiryNote
};
