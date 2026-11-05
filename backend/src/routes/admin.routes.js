'use strict';

const express = require('express');
const { loginLimiter, exportLimiter } = require('../middleware/rateLimiter');
const { authenticateAdmin, authorizeRoles } = require('../middleware/authenticateAdmin');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Public Authentication Endpoint (Rate limited to 5 attempts per 15 min per IP)
router.post('/login', loginLimiter, adminController.login);
router.post('/logout', adminController.logout);

// Protected Administrative Endpoints
router.get('/me', authenticateAdmin, adminController.getMe);
router.patch('/me/password', authenticateAdmin, adminController.changePassword);
router.get('/stats', authenticateAdmin, adminController.getDashboardStats);

// Enquiries Management
router.get('/enquiries/export', authenticateAdmin, exportLimiter, adminController.exportEnquiries);
router.get('/enquiries', authenticateAdmin, adminController.listEnquiries);
router.get('/enquiries/:id', authenticateAdmin, adminController.getEnquiryById);
router.patch('/enquiries/:id/status', authenticateAdmin, adminController.updateEnquiryStatus);
router.post('/enquiries/:id/notes', authenticateAdmin, adminController.addEnquiryNote);
router.delete('/enquiries/:id', authenticateAdmin, authorizeRoles('superadmin'), adminController.deleteEnquiry);

module.exports = router;
