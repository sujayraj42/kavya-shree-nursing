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
 * Forwards application summary to Render's enquiry endpoint as fallback persistence.
 */
function forwardToRenderEnquiry(payload, appNumber) {
  return new Promise((resolve) => {
    try {
      const summaryMsg = `[ONLINE_APPLICATION ${appNumber}] Father: ${payload.fatherName || 'N/A'}, Mother: ${payload.motherName || 'N/A'}, District: ${payload.address?.district || 'N/A'}, 12th PCB: ${payload.academicDetails?.pcbPercentage || 'N/A'}%`;
      const body = JSON.stringify({
        name: payload.applicantName,
        phone: payload.phone,
        email: payload.email || undefined,
        program: payload.program,
        message: summaryMsg.slice(0, 950),
        consent: true
      });

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

/**
 * Forwards full application payload to Render's dedicated application endpoint
 * so that a real Application record is created in MongoDB.
 */
function forwardToRenderApplication(payload, appNumber) {
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify({
        ...payload,
        applicationNumber: appNumber
      });

      const req = https.request({
        hostname: 'kavya-shree-nursing.onrender.com',
        path: '/api/applications',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 6000
      }, (res) => {
        let resData = '';
        res.on('data', chunk => { resData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            // Render /api/applications rejected; fallback to enquiry persistence
            forwardToRenderEnquiry(payload, appNumber).then(status => {
              resolve({ success: false, statusCode: res.statusCode, fallbackStatus: status });
            });
          }
        });
      });

      req.on('error', () => {
        forwardToRenderEnquiry(payload, appNumber).then(status => {
          resolve({ success: false, fallbackStatus: status });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        forwardToRenderEnquiry(payload, appNumber).then(status => {
          resolve({ success: false, fallbackStatus: status });
        });
      });

      req.write(body);
      req.end();
    } catch {
      forwardToRenderEnquiry(payload, appNumber).then(status => {
        resolve({ success: false, fallbackStatus: status });
      });
    }
  });
}

/**
 * Proxies application status lookups to the upstream live Render database.
 */
function forwardStatusLookupToRender(ref, res) {
  const req = https.request({
    hostname: 'kavya-shree-nursing.onrender.com',
    path: `/api/applications/${encodeURIComponent(ref)}`,
    method: 'GET',
    timeout: 5000
  }, (remoteRes) => {
    let raw = '';
    remoteRes.on('data', chunk => { raw += chunk; });
    remoteRes.on('end', () => {
      res.statusCode = remoteRes.statusCode || 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(raw);
    });
  });

  req.on('error', () => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Upstream admissions service unavailable.' }));
  });

  req.on('timeout', () => {
    req.destroy();
    res.statusCode = 504;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Gateway timeout contacting admissions database.' }));
  });

  req.end();
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    const urlObj = new URL(req.url, 'http://localhost');
    const ref = urlObj.searchParams.get('ref') || urlObj.searchParams.get('appNumber');

    if (ref) {
      return forwardStatusLookupToRender(ref, res);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      service: 'Kavya Shree Institute of Nursing - Admissions API',
      academicSession: '2026-2027',
      endpoint: '/api/applications',
      supportedPrograms: VALID_PROGRAMS,
      instructions: 'Submit a POST request with applicantName, phone, dob, fatherName, motherName, address, program, academicDetails, and declaration.'
    }));
  }

  if (req.method === 'POST') {
    let rawBody = '';

    if (typeof req.body === 'object' && req.body !== null) {
      handleSubmission(req.body, res);
    } else {
      req.on('data', chunk => { rawBody += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(rawBody || '{}');
          handleSubmission(parsed, res);
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

async function handleSubmission(body, res) {
  const applicantName = sanitize(body.applicantName);
  const phone = String(body.phone || '').replace(/\D/g, '');
  const email = sanitize(body.email).toLowerCase();
  const program = sanitize(body.program);

  if (!applicantName || applicantName.length < 2) {
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
      error: 'Invalid or missing program choice.',
      allowedPrograms: VALID_PROGRAMS
    }));
  }

  // Generate or preserve official reference number: KSIN-2026-APP-XXXXXX
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const applicationNumber = body.applicationNumber && /^KSIN-2026-APP-[A-Za-z0-9_-]{4,20}$/.test(String(body.applicationNumber))
    ? sanitize(body.applicationNumber)
    : `KSIN-2026-APP-${randomSuffix}`;

  // Forward to MongoDB persistence asynchronously
  forwardToRenderApplication(body, applicationNumber).catch(() => {});

  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    success: true,
    message: 'Application registered successfully for admissions intake 2026-2027.',
    data: {
      applicationNumber,
      applicantName,
      program,
      phone,
      email: email || undefined,
      submissionDate: new Date().toISOString(),
      status: 'SUBMITTED'
    }
  }));
}
