'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { Admin } = require('../models/Admin');
const { Enquiry, VALID_STATUSES, ALL_ALLOWED_STATUSES, normalizeStatus } = require('../models/Enquiry');
const { notifyStatusTransition } = require('../services/automation.service');
const { logAdminAction } = require('../services/auditLogger');

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

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      // Generic error: do not disclose password mismatch
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

    admin.lastLoginAt = new Date();
    await admin.save();
    logAdminAction({ admin, action: 'LOGIN_SUCCESS', targetType: 'Admin', targetId: admin.id || admin._id, ip: req.ip });

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

    res.cookie('ks_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

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
    const { status, program, search, dateFrom, dateTo } = req.query;

    const query = { deletedAt: null };

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

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom && typeof dateFrom === 'string') {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          query.createdAt.$gte = fromDate;
        }
      }
      if (dateTo && typeof dateTo === 'string') {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }
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
    if (!enquiry || enquiry.deletedAt) {
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
    if (!enquiry || enquiry.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }

    enquiry.status = normalizedStatus;
    await enquiry.save();
    logAdminAction({ admin: req.admin, action: 'UPDATE_ENQUIRY_STATUS', targetType: 'Enquiry', targetId: enquiry.id || enquiry._id, details: { newStatus: normalizedStatus }, ip: req.ip });

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
    if (!enquiry || enquiry.deletedAt) {
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
    logAdminAction({ admin: req.admin, action: 'ADD_ENQUIRY_NOTE', targetType: 'Enquiry', targetId: enquiry.id || enquiry._id, ip: req.ip });

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
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Enquiry.countDocuments({ deletedAt: null }),
      Enquiry.find({ deletedAt: null })
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

function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Streams or sends enquiry records as CSV for reporting and compliance audits.
 */
async function exportEnquiries(req, res, next) {
  try {
    const query = { deletedAt: null };

    if (req.query.status && req.query.status !== 'all') {
      const trimmed = req.query.status.trim().toLowerCase();
      if (ALL_ALLOWED_STATUSES.includes(trimmed)) {
        query.status = trimmed;
      }
    }
    if (req.query.program && req.query.program !== 'all') {
      query.program = req.query.program.trim();
    }
    if (req.query.search && String(req.query.search).trim()) {
      const clean = String(req.query.search).trim().slice(0, 100);
      const searchRegex = new RegExp(escapeRegex(clean), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) {
        const d = new Date(req.query.dateFrom);
        if (!isNaN(d.getTime())) query.createdAt.$gte = d;
      }
      if (req.query.dateTo) {
        const d = new Date(req.query.dateTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          query.createdAt.$lte = d;
        }
      }
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });

    const headers = [
      'Reference ID',
      'Submission Date',
      'Candidate Name',
      'Phone',
      'Email',
      'Program',
      'Status',
      'Consent',
      'Notes Count',
      'Message'
    ];

    const rows = enquiries.map(e => [
      escapeCsvCell(e.id || e._id ? (e.id || e._id).toString().slice(-6).toUpperCase() : ''),
      escapeCsvCell(e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : ''),
      escapeCsvCell(e.name),
      escapeCsvCell(e.phone),
      escapeCsvCell(e.email || ''),
      escapeCsvCell(e.program),
      escapeCsvCell(e.status),
      escapeCsvCell(e.consent ? 'Yes' : 'No'),
      escapeCsvCell(Array.isArray(e.notes) ? e.notes.length : 0),
      escapeCsvCell(e.message || '')
    ]);

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const filename = `kavya-shree-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    logAdminAction({ admin: req.admin, action: 'EXPORT_ENQUIRIES_CSV', targetType: 'Enquiry', details: { count: rows.length }, ip: req.ip });
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Soft deletes an admissions enquiry. Accessible only to superadmin role.
 */
async function deleteEnquiry(req, res, next) {
  try {
    if (req.admin?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmin accounts can delete enquiries'
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid enquiry ID format' });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry || enquiry.deletedAt) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    enquiry.deletedAt = new Date();
    await enquiry.save();
    logAdminAction({ admin: req.admin, action: 'DELETE_ENQUIRY', targetType: 'Enquiry', targetId: enquiry.id || enquiry._id, ip: req.ip });

    res.status(200).json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates administrator password. Requires existing password confirmation and min 8 characters.
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        error: 'New password must not exceed 128 characters'
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Administrator account not found'
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password does not match'
      });
    }

    admin.password = newPassword;
    await admin.save();
    logAdminAction({ admin: req.admin, action: 'CHANGE_PASSWORD', targetType: 'Admin', targetId: req.admin.id || req.admin._id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Administrator session termination. Clears httpOnly authentication cookie.
 */
async function logout(req, res) {
  res.clearCookie('ks_admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}

module.exports = {
  login,
  logout,
  getMe,
  getDashboardStats,
  listEnquiries,
  exportEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  addEnquiryNote,
  deleteEnquiry,
  changePassword
};
