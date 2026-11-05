'use strict';

const express = require('express');
const { enquiryLimiter, lookupLimiter, exportLimiter } = require('../middleware/rateLimiter');
const { authenticateAdmin, authorizeRoles } = require('../middleware/authenticateAdmin');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

// Public: Submit online application (Rate limited)
router.post('/', enquiryLimiter, applicationController.submitApplication);

// Public: API Overview / Query application status
router.get('/', applicationController.getApplicationStatus);

// Public: Automated Candidate Application Slip / Receipt (Printable HTML / PDF, Rate limited)
router.get('/:appNumber/receipt', lookupLimiter, applicationController.getApplicationReceipt);

// Protected Admin: Endpoints
router.get('/admin/export', authenticateAdmin, exportLimiter, applicationController.exportApplications);
router.get('/admin', authenticateAdmin, applicationController.listApplications);
router.get('/admin/:id/receipt', authenticateAdmin, applicationController.getApplicationReceipt);
router.get('/admin/:id', authenticateAdmin, applicationController.getApplicationById);
router.patch('/admin/:id/status', authenticateAdmin, applicationController.updateApplicationStatus);
router.post('/admin/:id/notes', authenticateAdmin, applicationController.addApplicationNote);
router.delete('/admin/:id', authenticateAdmin, authorizeRoles('superadmin'), applicationController.deleteApplication);

// Public: Individual Application status lookup by reference number (Rate limited)
router.get('/:appNumber', lookupLimiter, applicationController.getApplicationStatus);

module.exports = router;
