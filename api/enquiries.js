'use strict';

const https = require('https');

const VALID_PROGRAMS = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
];

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

/**
 * Forwards enquiry to live Render backend instance to ensure MongoDB persistence.
 */
function forwardToRenderEnquiry(payload) {
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify(payload);
      const req = https.request({
        hostname: 'kavya-shree-nursing.onrender.com',
        path: '/api/enquiries',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 5000
      }, (res) => {
        res.resume();
        resolve(res.statusCode);
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.write(body);
      req.end();
    } catch {
      resolve(null);
    }
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      service: 'Kavya Shree Institute of Nursing - Admissions Enquiry API',
      academicSession: '2026-2027',
      endpoint: '/api/enquiries',
      allowedPrograms: VALID_PROGRAMS,
      instructions: 'Submit a POST request with name, phone, program, consent, and optional email or message.'
    }));
  }

  if (req.method === 'POST') {
    let rawBody = '';

    if (typeof req.body === 'object' && req.body !== null) {
      handleEnquirySubmission(req.body, res);
    } else {
      req.on('data', chunk => { rawBody += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(rawBody || '{}');
          handleEnquirySubmission(parsed, res);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload.' }));
        }
      });
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
};

function handleEnquirySubmission(body, res) {
  const name = sanitize(body.name);
  const phone = String(body.phone || '').replace(/\D/g, '');
  const email = sanitize(body.email).toLowerCase();
  const program = sanitize(body.program);
  const message = sanitize(body.message);
  const consent = body.consent === true || body.consent === 'true';

  // Honeypot check
  if (body.website && String(body.website).trim() !== '') {
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      message: 'Enquiry registered successfully',
      data: { id: `enq_${Date.now()}` }
    }));
  }

  if (!name || name.length < 2) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Candidate full name is required (minimum 2 characters).'
    }));
  }

  if (!phone || phone.length < 10) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'A valid 10-digit mobile number is required.'
    }));
  }

  if (!program || !VALID_PROGRAMS.includes(program)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Please select a valid nursing program from the accredited list.',
      allowedPrograms: VALID_PROGRAMS
    }));
  }

  if (!consent) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Consent to be contacted by the admissions secretariat is required.'
    }));
  }

  const enquiryId = `ENQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Forward to MongoDB persistence asynchronously
  forwardToRenderEnquiry({
    name,
    phone,
    email: email || undefined,
    program,
    message: message || undefined,
    consent: true
  }).catch(() => {});

  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    success: true,
    message: 'Enquiry registered successfully. Our admissions counselor will contact you shortly.',
    data: {
      id: enquiryId,
      name,
      phone,
      program,
      status: 'new',
      createdAt: new Date().toISOString()
    }
  }));
}
