'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { Admin } = require('../models/Admin');
const { Enquiry, VALID_STATUSES, ALL_ALLOWED_STATUSES, normalizeStatus } = require('../models/Enquiry');
const { notifyStatusTransition } = require('../services/automation.service');
const { logAdminAction } = require('../services/auditLogger');
const { cacheService } = require('../services/cache.service');
const {
  EMAIL_REGEX,
  sanitizeText,
  escapeRegex,
  escapeCsvCell,
  parsePagination,
  applyDateRangeFilter
} = require('../utils/common');

// Pre-computed hash used to equalise response timing when an email is unknown,
// so login latency does not reveal which administrator emails exist.
const TIMING_EQUALISATION_HASH = bcrypt.hashSync('timing-equalisation-placeholder', 12);

/**
 * Builds a sanitized Mongoose filter query for enquiries from request query parameters.
 */
function buildEnquiryFilterQuery(reqQuery = {}, strictStatusValidation = false) {
  const { status, program, search, dateFrom, dateTo } = reqQuery;
  const query = { deletedAt: null };

  if (typeof status === 'string' && status.trim() && status.trim().toLowerCase() !== 'all') {
    const trimmedStatus = status.trim().toLowerCase();
    if (ALL_ALLOWED_STATUSES.includes(trimmedStatus)) {
      query.status = trimmedStatus;
    } else if (strictStatusValidation) {
      return {
        error: `Invalid status filter. Must be one of: ${ALL_ALLOWED_STATUSES.join(', ')}`
      };
    }
  }

  if (typeof program === 'string' && program.trim() && program.trim().toLowerCase() !== 'all') {
    query.program = program.trim();
  }

  if (typeof search === 'string' && search.trim()) {
    const searchClean = search.trim().slice(0, 100);
    const searchRegex = new RegExp(escapeRegex(searchClean), 'i');
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex }
    ];
  }

  applyDateRangeFilter(query, dateFrom, dateTo);
  return { query };
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
      await bcrypt.compare(password, TIMING_EQUALISATION_HASH);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
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
    const adminId = (admin.id || admin._id).toString();
    logAdminAction({ admin, action: 'LOGIN_SUCCESS', targetType: 'Admin', targetId: adminId, ip: req.ip });

    const token = jwt.sign(
      {
        id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
    );

    res.cookie('ks_admin_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      admin: {
        id: adminId,
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
    const { query, error } = buildEnquiryFilterQuery(req.query, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    const { page, limit, skip } = parsePagination(req.query, 10, 100);

    let enquiryQuery = Enquiry.find(query);
    if (typeof enquiryQuery.select === 'function') {
      enquiryQuery = enquiryQuery.select('name phone email program status message notes createdAt updatedAt');
    }
    if (typeof enquiryQuery.sort === 'function') {
      enquiryQuery = enquiryQuery.sort({ createdAt: -1 });
    }
    if (typeof enquiryQuery.skip === 'function') {
      enquiryQuery = enquiryQuery.skip(skip);
    }
    if (typeof enquiryQuery.limit === 'function') {
      enquiryQuery = enquiryQuery.limit(limit);
    }

    const [total, rawEnquiries] = await Promise.all([
      Enquiry.countDocuments(query),
      typeof enquiryQuery.lean === 'function' ? enquiryQuery.lean() : enquiryQuery
    ]);

    const enquiries = rawEnquiries.map(e => ({
      ...e,
      id: e._id ? e._id.toString() : e.id
    }));

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

    const previousStatus = enquiry.status;
    enquiry.status = normalizedStatus;
    await enquiry.save();
    await cacheService.invalidateStats();

    const targetId = (enquiry.id || enquiry._id).toString();
    logAdminAction({
      admin: req.admin,
      action: 'UPDATE_ENQUIRY_STATUS',
      targetType: 'Enquiry',
      targetId,
      details: { previousStatus, newStatus: normalizedStatus },
      ip: req.ip
    });

    notifyStatusTransition({
      entityType: 'Enquiry',
      id: targetId,
      referenceNumber: targetId.slice(-6).toUpperCase(),
      previousStatus,
      newStatus: normalizedStatus,
      candidateName: enquiry.name,
      candidatePhone: enquiry.phone,
      adminUser: req.admin
    });

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: {
        id: targetId,
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

    const author = req.admin.name || req.admin.email || 'Administrator';
    const cleanNoteText = sanitizeText(trimmedText);
    if (!cleanNoteText) {
      return res.status(400).json({
        success: false,
        error: 'Note text cannot be empty'
      });
    }

    enquiry.notes.push({
      author,
      text: cleanNoteText
    });

    await enquiry.save();
    logAdminAction({
      admin: req.admin,
      action: 'ADD_ENQUIRY_NOTE',
      targetType: 'Enquiry',
      targetId: enquiry.id || enquiry._id,
      ip: req.ip
    });

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
    const cached = await cacheService.get('stats:dashboard');
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let recentQuery = Enquiry.find({ deletedAt: null });
    if (typeof recentQuery.select === 'function') {
      recentQuery = recentQuery.select('name phone email program status createdAt');
    }
    if (typeof recentQuery.sort === 'function') {
      recentQuery = recentQuery.sort({ createdAt: -1 });
    }
    if (typeof recentQuery.limit === 'function') {
      recentQuery = recentQuery.limit(5);
    }

    const [statusAggregation, total, recentRaw] = await Promise.all([
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
      typeof recentQuery.lean === 'function' ? recentQuery.lean() : recentQuery
    ]);

    const recentEnquiries = recentRaw.map(e => ({
      ...e,
      id: e._id ? e._id.toString() : e.id
    }));

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

    const responsePayload = {
      success: true,
      data: {
        stats,
        recentEnquiries
      }
    };

    await cacheService.set('stats:dashboard', responsePayload, 30);
    res.set('X-Cache', 'MISS');
    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
}

/**
 * Streams or sends enquiry records as CSV for reporting and compliance audits.
 */
async function exportEnquiries(req, res, next) {
  try {
    const { query } = buildEnquiryFilterQuery(req.query, false);
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
    logAdminAction({
      admin: req.admin,
      action: 'EXPORT_ENQUIRIES_CSV',
      targetType: 'Enquiry',
      details: { count: rows.length },
      ip: req.ip
    });
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
    await cacheService.invalidateStats();
    logAdminAction({
      admin: req.admin,
      action: 'DELETE_ENQUIRY',
      targetType: 'Enquiry',
      targetId: enquiry.id || enquiry._id,
      ip: req.ip
    });

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
    await cacheService.invalidateAdminSession(req.admin.id);
    logAdminAction({
      admin: req.admin,
      action: 'CHANGE_PASSWORD',
      targetType: 'Admin',
      targetId: req.admin.id || req.admin._id,
      ip: req.ip
    });

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
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax'
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
