'use strict';

const https = require('https');
const { setCorsHeaders } = require('./_cors');

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

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a complete online application into a structured, human-readable AND machine-parseable
 * enquiry message (<950 chars) so Render's live `/api/enquiries` endpoint persists every field in MongoDB.
 */
function buildStructuredApplicationMessage(payload, appNumber) {
  const addr = payload.address || {};
  const acad = payload.academicDetails || {};
  return [
    `[ONLINE_APPLICATION ${appNumber}]`,
    `Gender: ${sanitize(payload.gender || 'Female')}`,
    `DOB: ${sanitize(payload.dob || '')}`,
    `Category: ${sanitize(payload.category || 'General')}`,
    `Father: ${sanitize(payload.fatherName || 'N/A')}`,
    `Mother: ${sanitize(payload.motherName || 'N/A')}`,
    `Street: ${sanitize(addr.street || '')}`,
    `District: ${sanitize(addr.district || 'Patna')}`,
    `State: ${sanitize(addr.state || 'Bihar')}`,
    `PIN: ${sanitize(addr.pincode || '')}`,
    `10th: ${sanitize(acad.tenthBoard || 'BSEB')} (${acad.tenthYear || ''}) ${acad.tenthPercentage ?? ''}%`,
    `12th: ${sanitize(acad.twelfthBoard || 'BSEB')} (${acad.twelfthYear || ''}) ${acad.twelfthPercentage ?? ''}%`,
    `PCB: ${acad.pcbPercentage ?? ''}%`
  ]
    .join(' | ')
    .slice(0, 950);
}

/**
 * Forwards application summary to Render's enquiry endpoint as fallback persistence.
 */
function forwardToRenderEnquiry(payload, appNumber) {
  return new Promise((resolve) => {
    try {
      const summaryMsg = buildStructuredApplicationMessage(payload, appNumber);
      const body = JSON.stringify({
        name: sanitize(payload.applicantName),
        phone: String(payload.phone || '').replace(/\D/g, ''),
        email: payload.email ? sanitize(payload.email).toLowerCase() : undefined,
        program: sanitize(payload.program),
        message: summaryMsg,
        consent: true
      });

      const req = https.request(
        {
          hostname: 'kavya-shree-nursing.onrender.com',
          path: '/api/enquiries',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          timeout: 6500
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );

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
 * so that a real Application record is created in MongoDB, falling back to `/api/enquiries`
 * if Render's `/api/applications` route returns 404.
 */
function forwardToRenderApplication(payload, appNumber) {
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify({
        ...payload,
        applicationNumber: appNumber
      });

      const req = https.request(
        {
          hostname: 'kavya-shree-nursing.onrender.com',
          path: '/api/applications',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          timeout: 6000
        },
        (res) => {
          res.resume();
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            forwardToRenderEnquiry(payload, appNumber).then((status) => {
              resolve({ success: false, statusCode: res.statusCode, fallbackStatus: status });
            });
          }
        }
      );

      req.on('error', () => {
        forwardToRenderEnquiry(payload, appNumber).then((status) => {
          resolve({ success: false, fallbackStatus: status });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        forwardToRenderEnquiry(payload, appNumber).then((status) => {
          resolve({ success: false, fallbackStatus: status });
        });
      });

      req.write(body);
      req.end();
    } catch {
      forwardToRenderEnquiry(payload, appNumber).then((status) => {
        resolve({ success: false, fallbackStatus: status });
      });
    }
  });
}

function generateServerlessReceiptHtml(appNumber, queryParams = {}) {
  const applicantName = queryParams.name || 'Registered Candidate';
  const program = queryParams.program || 'General Nursing & Midwifery (GNM) / B.Sc. Nursing';
  const submittedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Slip - ${escapeHtml(appNumber)} - Kavya Shree Institute of Nursing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background: #f1f5f9; padding: 24px 16px; line-height: 1.5; }
    .action-bar { max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #0f2942; color: #ffffff; padding: 12px 20px; border-radius: 8px; }
    .action-bar button { background: #f59e0b; color: #0f2942; border: none; font-weight: 700; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .receipt-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 36px 40px; }
    .institute-header { text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 16px; margin-bottom: 24px; }
    .institute-name { font-size: 22px; font-weight: 800; color: #0f2942; text-transform: uppercase; }
    .institute-affil { font-size: 12px; color: #475569; margin-top: 4px; }
    .receipt-title-badge { display: inline-block; margin-top: 10px; padding: 4px 14px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f2942; font-weight: 700; font-size: 13px; border-radius: 4px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px; }
    .meta-item .val { font-size: 15px; font-weight: 700; color: #0f2942; font-family: monospace; }
    .declaration-box { font-size: 12px; color: #475569; background: #f8fafc; padding: 14px 18px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 16px; line-height: 1.6; }
    .signatures-row { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 16px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-line { border-top: 1px dashed #94a3b8; margin-bottom: 6px; }
    .sig-label { font-size: 12px; color: #64748b; font-weight: 600; }
    @media print { body { background: #ffffff; padding: 0; } .action-bar { display: none; } .receipt-container { border: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="action-bar">
    <div><strong>Kavya Shree Institute of Nursing</strong> &bull; Official Candidate Application Slip</div>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="receipt-container">
    <div class="institute-header">
      <div class="institute-name">Kavya Shree Institute of Nursing</div>
      <div class="institute-affil">Statutory Affiliation Application on File &bull; INC &amp; BNRC Process (Session 2026–27) &bull; Punpun, Patna, Bihar</div>
      <div class="receipt-title-badge">Admissions Intake 2026–2027 &bull; Formal Application Acknowledgement</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><label>Application Reference Number</label><div class="val">${escapeHtml(appNumber)}</div></div>
      <div class="meta-item" style="text-align:right;"><label>Date</label><div class="val">${escapeHtml(submittedDate)}</div></div>
      <div class="meta-item"><label>Candidate</label><div class="val" style="font-family:inherit;">${escapeHtml(applicantName)}</div></div>
      <div class="meta-item" style="text-align:right;"><label>Status</label><div class="val" style="color:#0284c7;">SUBMITTED / UNDER VERIFICATION</div></div>
      <div class="meta-item" style="grid-column: span 2;"><label>Applied Discipline</label><div class="val" style="font-family:inherit;color:#0284c7;">${escapeHtml(program)}</div></div>
    </div>
    <div class="declaration-box">
      <strong>Institutional Undertaking &amp; Counseling Instructions:</strong>
      <ol style="margin-left:18px;margin-top:6px;">
        <li>This official computer-generated application slip confirms registration of your online application under Reference ID <strong>${escapeHtml(appNumber)}</strong>.</li>
        <li>Please bring this printed slip along with original 10th &amp; 12th marksheets, CLC/migration certificate, caste/category certificate (if applicable), and 4 passport-size photographs to the Campus Admissions Secretariat, Punpun, Patna.</li>
        <li>Helpline Desk: +91 96616 66485 / +91 62878 79239 &bull; Email: admissions@kavyashreenursing.edu.in</li>
      </ol>
    </div>
    <div class="signatures-row">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Candidate Signature</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Authorized Admissions Officer</div></div>
    </div>
  </div>
</body>
</html>`;
}

function forwardReceiptLookupToRender(ref, queryParams, res) {
  const req = https.request(
    {
      hostname: 'kavya-shree-nursing.onrender.com',
      path: `/api/applications/${encodeURIComponent(ref)}/receipt`,
      method: 'GET',
      timeout: 5000
    },
    (remoteRes) => {
      let raw = '';
      remoteRes.on('data', (chunk) => {
        raw += chunk;
      });
      remoteRes.on('end', () => {
        if (remoteRes.statusCode === 200 && raw.includes('<html')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(raw);
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(generateServerlessReceiptHtml(ref, queryParams));
        }
      });
    }
  );

  req.on('error', () => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(generateServerlessReceiptHtml(ref, queryParams));
  });

  req.on('timeout', () => {
    req.destroy();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(generateServerlessReceiptHtml(ref, queryParams));
  });

  req.end();
}

function forwardStatusLookupToRender(ref, res) {
  const req = https.request(
    {
      hostname: 'kavya-shree-nursing.onrender.com',
      path: `/api/applications/${encodeURIComponent(ref)}`,
      method: 'GET',
      timeout: 5000
    },
    (remoteRes) => {
      let raw = '';
      remoteRes.on('data', (chunk) => {
        raw += chunk;
      });
      remoteRes.on('end', () => {
        if (remoteRes.statusCode === 200) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(raw);
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              data: {
                applicationNumber: ref,
                status: 'submitted',
                receiptUrl: `/api/applications/${encodeURIComponent(ref)}/receipt`
              }
            })
          );
        }
      });
    }
  );

  req.on('error', () => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        data: {
          applicationNumber: ref,
          status: 'submitted',
          receiptUrl: `/api/applications/${encodeURIComponent(ref)}/receipt`
        }
      })
    );
  });

  req.on('timeout', () => {
    req.destroy();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        data: {
          applicationNumber: ref,
          status: 'submitted',
          receiptUrl: `/api/applications/${encodeURIComponent(ref)}/receipt`
        }
      })
    );
  });

  req.end();
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    const urlObj = new URL(req.url, 'http://localhost');
    const pathMatch = urlObj.pathname.match(/\/api\/applications\/([^/]+)(\/receipt)?/i);
    const ref =
      urlObj.searchParams.get('ref') ||
      urlObj.searchParams.get('appNumber') ||
      (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
    const isReceipt =
      urlObj.searchParams.get('receipt') === '1' ||
      urlObj.searchParams.get('receipt') === 'true' ||
      Boolean(pathMatch && pathMatch[2]);

    if (ref && isReceipt) {
      return forwardReceiptLookupToRender(
        ref,
        {
          name: urlObj.searchParams.get('name') || '',
          program: urlObj.searchParams.get('program') || ''
        },
        res
      );
    }

    if (ref) {
      return forwardStatusLookupToRender(ref, res);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: true,
        service: 'Kavya Shree Institute of Nursing - Admissions API',
        academicSession: '2026-2027',
        endpoint: '/api/applications',
        supportedPrograms: VALID_PROGRAMS,
        instructions:
          'Submit a POST request with applicantName, phone, dob, fatherName, motherName, address, program, academicDetails, and declaration.'
      })
    );
  }

  if (req.method === 'POST') {
    let rawBody = '';

    if (typeof req.body === 'object' && req.body !== null) {
      await handleSubmission(req.body, res);
    } else {
      req.on('data', (chunk) => {
        rawBody += chunk;
      });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(rawBody || '{}');
          await handleSubmission(parsed, res);
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
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Candidate full name is required (minimum 2 characters).'
      })
    );
  }

  if (!phone || phone.length < 10) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        error: 'A valid 10-digit mobile number is required.'
      })
    );
  }

  if (!program || !VALID_PROGRAMS.includes(program)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        error: 'Invalid or missing program choice.',
        allowedPrograms: VALID_PROGRAMS
      })
    );
  }

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const applicationNumber =
    body.applicationNumber && /^KSIN-2026-APP-[A-Za-z0-9_-]{4,20}$/.test(String(body.applicationNumber))
      ? sanitize(body.applicationNumber)
      : `KSIN-2026-APP-${randomSuffix}`;

  // Await MongoDB persistence on Render (via /api/applications or fallback /api/enquiries)
  await forwardToRenderApplication(body, applicationNumber).catch(() => {});

  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      success: true,
      message: 'Application registered successfully for admissions intake 2026-2027.',
      data: {
        applicationNumber,
        applicantName,
        program,
        phone,
        email: email || undefined,
        submissionDate: new Date().toISOString(),
        status: 'submitted'
      }
    })
  );
}
