'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { Admin } = require('../models/Admin');

/**
 * Express middleware to authenticate administrative requests using Bearer JWT.
 * Verifies signature, expiration, and binds the verified admin identity to req.admin.
 */
async function authenticateAdmin(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/ks_admin_token=([^;]+)/);
      if (match) token = match[1].trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or malformed authorization header.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Authentication session expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.'
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload.'
      });
    }

    // Verify token ID format is a valid MongoDB ObjectId to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.'
      });
    }

    // Verify administrator account still exists in database and is active
    const admin = await Admin.findById(decoded.id).select('email name role isActive');
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Administrator identity not recognized or revoked.'
      });
    }

    if (admin.isActive === false) {
      return res.status(401).json({
        success: false,
        error: 'Administrator account is inactive or disabled.'
      });
    }

    // Role verification: ensure only valid administrative roles are authorized
    if (!['admin', 'superadmin'].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrative privileges required.'
      });
    }

    req.admin = {
      id: admin.id || admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware to enforce explicit role policies per route.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before checking role authorizations.'
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Action requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

authenticateAdmin.authorizeRoles = authorizeRoles;
authenticateAdmin.authenticateAdmin = authenticateAdmin;

module.exports = authenticateAdmin;
