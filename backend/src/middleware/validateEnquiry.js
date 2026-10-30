'use strict';

const { VALID_PROGRAMS } = require('../models/Enquiry');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateEnquiry(req, res, next) {
  const body = req.body || {};
  const errors = [];

  // 1. Name validation (sanitized to remove HTML tags)
  let name = stripHtml(typeof body.name === 'string' ? body.name : '');
  if (!name) {
    errors.push({ field: 'name', message: 'Candidate full name is required' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Candidate name must be at least 2 characters long' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: 'Candidate name must not exceed 100 characters' });
  }

  // 2. Phone validation
  let phoneRaw = body.phone !== undefined && body.phone !== null ? String(body.phone).trim() : '';
  const phoneDigits = phoneRaw.replace(/\D/g, '');
  if (!phoneRaw) {
    errors.push({ field: 'phone', message: 'Contact phone number is required' });
  } else if (phoneDigits.length < 10) {
    errors.push({ field: 'phone', message: 'Phone number must contain at least 10 digits' });
  } else if (phoneDigits.length > 15) {
    errors.push({ field: 'phone', message: 'Phone number must not exceed 15 digits' });
  }

  // 3. Email validation (Optional)
  let email = null;
  if (body.email !== undefined && body.email !== null && String(body.email).trim() !== '') {
    const emailCandidate = String(body.email).trim().toLowerCase();
    if (emailCandidate.length > 255) {
      errors.push({ field: 'email', message: 'Email address must not exceed 255 characters' });
    } else if (!EMAIL_REGEX.test(emailCandidate)) {
      errors.push({ field: 'email', message: 'Please provide a syntactically valid email address' });
    } else {
      email = emailCandidate;
    }
  }

  // 4. Program validation
  let program = typeof body.program === 'string' ? body.program.trim() : '';
  if (!program) {
    errors.push({ field: 'program', message: 'Intended academic program is required' });
  } else if (!VALID_PROGRAMS.includes(program)) {
    errors.push({
      field: 'program',
      message: `Invalid program selected. Allowed: ${VALID_PROGRAMS.join(', ')}`
    });
  }

  // 5. Message validation (Optional, sanitized to remove HTML tags)
  let message = '';
  if (body.message !== undefined && body.message !== null) {
    message = stripHtml(String(body.message));
    if (message.length > 1000) {
      errors.push({ field: 'message', message: 'Inquiry message must not exceed 1000 characters' });
    }
  }

  // 6. Consent validation
  const consent = body.consent === true || body.consent === 'true';
  if (!consent) {
    errors.push({
      field: 'consent',
      message: 'Candidate consent is required to process an admissions enquiry'
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  // Normalized payload attached to request
  req.validatedEnquiry = {
    name,
    phone: phoneDigits,
    email,
    program,
    message,
    consent: true
  };

  next();
}

module.exports = validateEnquiry;
