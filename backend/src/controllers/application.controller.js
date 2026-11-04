'use strict';

const mongoose = require('mongoose');
const { Application, VALID_APPLICATION_STATUSES } = require('../models/Application');
const { VALID_PROGRAMS } = require('../models/Enquiry');
const { notifyNewApplication, notifyStatusTransition } = require('../services/automation.service');
const { generateApplicationReceiptHtml } = require('../services/receipt.service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim();
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
 * Public candidate online application submission.
 */
async function submitApplication(req, res, next) {
  try {
    const body = req.body || {};

    // Honeypot check
    if (body.website && String(body.website).trim() !== '') {
      return res.status(201).json({
        success: true,
        message: 'Application received and logged for verification',
        data: {
          applicationNumber: `KSIN-2026-APP-${Math.floor(1000 + Math.random() * 9000)}`
        }
      });
    }

    const applicantName = sanitize(body.applicantName);
    const gender = sanitize(body.gender);
    const dob = body.dob ? new Date(body.dob) : null;
    const fatherName = sanitize(body.fatherName);
    const motherName = sanitize(body.motherName);
    const phone = String(body.phone || '').replace(/\D/g, '');
    const email = sanitize(body.email).toLowerCase();
    const category = sanitize(body.category) || 'General';
    const program = sanitize(body.program);
    const declaration = body.declaration === true || body.declaration === 'true';

    // Address extraction
    const rawAddress = body.address || {};
    const address = {
      street: sanitize(rawAddress.street),
      district: sanitize(rawAddress.district),
      state: sanitize(rawAddress.state) || 'Bihar',
      pincode: sanitize(rawAddress.pincode)
    };

    // Academic details extraction
    const rawAcad = body.academicDetails || {};
    const academicDetails = {
      tenthBoard: sanitize(rawAcad.tenthBoard),
      tenthYear: Number(rawAcad.tenthYear) || undefined,
      tenthPercentage: Number(rawAcad.tenthPercentage) || undefined,
      twelfthBoard: sanitize(rawAcad.twelfthBoard),
      twelfthYear: Number(rawAcad.twelfthYear) || undefined,
      twelfthPercentage: Number(rawAcad.twelfthPercentage) || undefined,
      pcbPercentage: Number(rawAcad.pcbPercentage) || undefined
    };

    const documents = {
      photoUrl: body.documents?.photoUrl ? String(body.documents.photoUrl).trim() : null,
      tenthMarksheetUrl: body.documents?.tenthMarksheetUrl ? String(body.documents.tenthMarksheetUrl).trim() : null,
      twelfthMarksheetUrl: body.documents?.twelfthMarksheetUrl ? String(body.documents.twelfthMarksheetUrl).trim() : null
    };

    // Validations
    if (!applicantName || applicantName.length < 2 || applicantName.length > 100) {
      return res.status(400).json({ success: false, error: 'Full applicant name is required (2-100 characters)' });
    }
    if (!gender || !['Female', 'Male', 'Other'].includes(gender)) {
      return res.status(400).json({ success: false, error: 'Valid gender selection is required' });
    }
    if (!dob || isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, error: 'Valid date of birth is required' });
    }
    if (!fatherName) {
      return res.status(400).json({ success: false, error: "Father's name is required" });
    }
    if (!motherName) {
      return res.status(400).json({ success: false, error: "Mother's name is required" });
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit Indian mobile number is required' });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }
    if (!address.district || !address.pincode) {
      return res.status(400).json({ success: false, error: 'District and pincode are required in address' });
    }
    if (!program || !VALID_PROGRAMS.includes(program)) {
      return res.status(400).json({ success: false, error: 'Please select a valid academic nursing program' });
    }
    if (!declaration) {
      return res.status(400).json({ success: false, error: 'Applicant declaration must be accepted' });
    }

    // Generate human-friendly reference application number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    const applicationNumber = `KSIN-2026-APP-${timestampSuffix}${randomSuffix}`;

    const newApp = await Application.create({
      applicationNumber,
      applicantName,
      gender,
      dob,
      fatherName,
      motherName,
      phone,
      email,
      category,
      address,
      program,
      academicDetails,
      documents,
      declaration: true,
      status: 'submitted'
    });

    // Trigger non-blocking automated notifications (Telegram, Webhook, CRM)
    notifyNewApplication(newApp);

    res.status(201).json({
      success: true,
      message: 'Admissions application submitted successfully',
      data: {
        id: newApp.id || newApp._id.toString(),
        applicationNumber: newApp.applicationNumber,
        applicantName: newApp.applicantName,
        program: newApp.program,
        submittedAt: newApp.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Protected Admin Endpoints
 */
async function listApplications(req, res, next) {
  try {
    const { status, program, search, dateFrom, dateTo } = req.query;
    const query = { deletedAt: null };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (program && program !== 'all') {
      query.program = program;
    }
    if (search && String(search).trim()) {
      const clean = String(search).trim().slice(0, 100).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(clean, 'i');
      query.$or = [
        { applicantName: regex },
        { phone: regex },
        { email: regex },
        { applicationNumber: regex }
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!isNaN(d.getTime())) query.createdAt.$gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          query.createdAt.$lte = d;
        }
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: { total, page, limit, pages }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getApplicationById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID format' });
    }

    const application = await Application.findOne({ _id: id, deletedAt: null });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application record not found' });
    }

    res.status(200).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID format' });
    }
    if (!status || !VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}`
      });
    }

    const application = await Application.findOne({ _id: id, deletedAt: null });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application record not found' });
    }

    const previousStatus = application.status;
    application.status = status;
    await application.save();

    notifyStatusTransition({
      entityType: 'Application',
      id: application.id || application._id.toString(),
      referenceNumber: application.applicationNumber,
      previousStatus,
      newStatus: status,
      candidateName: application.applicantName,
      candidatePhone: application.phone,
      adminUser: req.admin
    });

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        id: application.id || application._id.toString(),
        status: application.status,
        updatedAt: application.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
}

async function addApplicationNote(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID format' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Note text cannot be empty' });
    }

    const application = await Application.findOne({ _id: id, deletedAt: null });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application record not found' });
    }

    const author = req.admin?.name || req.admin?.email || 'Administrator';
    application.notes.push({ author, text: text.trim() });
    await application.save();

    const created = application.notes[application.notes.length - 1];
    res.status(201).json({ success: true, message: 'Note added successfully', data: created });
  } catch (err) {
    next(err);
  }
}

async function exportApplications(req, res, next) {
  try {
    const query = { deletedAt: null };
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.program && req.query.program !== 'all') query.program = req.query.program;

    const applications = await Application.find(query).sort({ createdAt: -1 });

    const headers = [
      'Application Number',
      'Submission Date',
      'Applicant Name',
      'Gender',
      'DOB',
      'Father Name',
      'Mother Name',
      'Phone',
      'Email',
      'Category',
      'District',
      'State',
      'Pincode',
      'Program',
      '10th %',
      '12th %',
      'PCB %',
      'Status'
    ];

    const rows = applications.map(app => [
      escapeCsvCell(app.applicationNumber),
      escapeCsvCell(app.createdAt ? new Date(app.createdAt).toISOString().slice(0, 10) : ''),
      escapeCsvCell(app.applicantName),
      escapeCsvCell(app.gender),
      escapeCsvCell(app.dob ? new Date(app.dob).toISOString().slice(0, 10) : ''),
      escapeCsvCell(app.fatherName),
      escapeCsvCell(app.motherName),
      escapeCsvCell(app.phone),
      escapeCsvCell(app.email),
      escapeCsvCell(app.category),
      escapeCsvCell(app.address?.district),
      escapeCsvCell(app.address?.state),
      escapeCsvCell(app.address?.pincode),
      escapeCsvCell(app.program),
      escapeCsvCell(app.academicDetails?.tenthPercentage || ''),
      escapeCsvCell(app.academicDetails?.twelfthPercentage || ''),
      escapeCsvCell(app.academicDetails?.pcbPercentage || ''),
      escapeCsvCell(app.status)
    ]);

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const filename = `kavya-shree-applications-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

async function deleteApplication(req, res, next) {
  try {
    if (req.admin?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmin accounts can delete applications'
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID format' });
    }

    const application = await Application.findOne({ _id: id, deletedAt: null });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application record not found' });
    }

    application.deletedAt = new Date();
    await application.save();

    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (err) {
    next(err);
  }
}


async function getApplicationReceipt(req, res, next) {
  try {
    const rawParam = String(req.params.appNumber || req.params.id || '').trim();
    if (!rawParam) {
      return res.status(400).send('Application number or ID is required');
    }

    let application = null;
    if (mongoose.Types.ObjectId.isValid(rawParam)) {
      application = await Application.findOne({ _id: rawParam, deletedAt: null });
    }
    if (!application) {
      application = await Application.findOne({ applicationNumber: rawParam, deletedAt: null });
    }

    if (!application) {
      return res.status(404).send('<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Application Not Found</h2><p>The requested application reference does not exist or has been archived.</p></body></html>');
    }

    const html = generateApplicationReceiptHtml(application);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationReceipt,
  addApplicationNote,
  exportApplications,
  deleteApplication
};

