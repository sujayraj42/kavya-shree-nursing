'use strict';

const express = require('express');
const { enquiryLimiter } = require('../middleware/rateLimiter');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

// Public: Submit online application (Rate limited)
router.post('/', enquiryLimiter, applicationController.submitApplication);

// Public: Automated Candidate Application Slip / Receipt (Printable HTML / PDF)
router.get('/:appNumber/receipt', applicationController.getApplicationReceipt);

// Protected Admin: Endpoints
router.get('/admin/export', authenticateAdmin, applicationController.exportApplications);
router.get('/admin', authenticateAdmin, applicationController.listApplications);
router.get('/admin/:id/receipt', authenticateAdmin, applicationController.getApplicationReceipt);
router.get('/admin/:id', authenticateAdmin, applicationController.getApplicationById);
router.patch('/admin/:id/status', authenticateAdmin, applicationController.updateApplicationStatus);
router.post('/admin/:id/notes', authenticateAdmin, applicationController.addApplicationNote);
router.delete('/admin/:id', authenticateAdmin, applicationController.deleteApplication);

module.exports = router;
