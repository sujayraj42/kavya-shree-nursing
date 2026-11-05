'use strict';

/**
 * Generates an official, printable institutional application slip / receipt HTML document.
 * Includes complete candidate details, academic scoreboard, document checklist,
 * verification seal, and auto-print capability.
 */
function generateApplicationReceiptHtml(app) {
  const submittedDate = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');

  const submittedTime = app.createdAt
    ? new Date(app.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    : '';

  const dobStr = app.dob
    ? new Date(app.dob).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Not Specified';

  const documents = app.documents || {};
  const docList = [
    { name: '10th Secondary Marksheet / Certificate', present: Boolean(documents.tenthMarksheet) },
    { name: '12th Senior Secondary Marksheet / Certificate', present: Boolean(documents.twelfthMarksheet) },
    { name: 'Government ID Proof (Aadhaar / Voter Card)', present: Boolean(documents.idProof) },
    { name: 'Candidate Passport Photograph', present: Boolean(documents.photo) }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Slip - ${escapeHtml(app.applicationNumber)} - Kavya Shree Institute of Nursing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #f1f5f9;
      padding: 24px 16px;
      line-height: 1.5;
    }
    .action-bar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f2942;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
    }
    .action-bar button {
      background: #f59e0b;
      color: #0f2942;
      border: none;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .action-bar button:hover { background: #d97706; }
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 36px 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .institute-header {
      text-align: center;
      border-bottom: 2px solid #0f2942;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .institute-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f2942;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .institute-affil {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      font-weight: 500;
    }
    .receipt-title-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #0f2942;
      font-weight: 700;
      font-size: 13px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      background: #f8fafc;
      padding: 16px 20px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .meta-item label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .meta-item .val {
      font-size: 15px;
      font-weight: 700;
      color: #0f2942;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .section-title {
      font-size: 13px;
      text-transform: uppercase;
      color: #0f2942;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-left: 4px solid #f59e0b;
      padding-left: 8px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .data-table th, .data-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      width: 25%;
    }
    .data-table td { color: #1e293b; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1e40af;
    }
    .declaration-box {
      font-size: 11px;
      color: #64748b;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-top: 16px;
      line-height: 1.6;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 16px;
    }
    .sig-box {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      margin-bottom: 6px;
    }
    .sig-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .seal-box {
      border: 2px solid #0f2942;
      color: #0f2942;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 14px;
      border-radius: 50%;
      width: 90px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      text-transform: uppercase;
      opacity: 0.7;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .action-bar { display: none; }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <div>
      <strong>Kavya Shree Institute of Nursing</strong> &bull; Official Candidate Application Slip
    </div>
    <div>
      <button onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
        </svg>
        Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="receipt-container">
    <div class="institute-header">
      <div class="institute-name">Kavya Shree Institute of Nursing</div>
      <div class="institute-affil">
        Statutory Affiliation Application on File &bull; INC &amp; BNRC Process (Session 2026–27) &bull; Punpun, Patna, Bihar
      </div>
      <div class="receipt-title-badge">
        Admissions Intake 2026–2027 &bull; Formal Application Acknowledgement
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Application Reference Number</label>
        <div class="val">${escapeHtml(app.applicationNumber)}</div>
      </div>
      <div class="meta-item" style="text-align: right;">
        <label>Submission Date & Time</label>
        <div class="val" style="font-size: 13px;">${submittedDate} ${submittedTime}</div>
      </div>
      <div class="meta-item">
        <label>Applied Program</label>
        <div class="val" style="font-family: inherit; font-size: 14px; color: #0284c7;">
          ${escapeHtml(app.program)}
        </div>
      </div>
      <div class="meta-item" style="text-align: right;">
        <label>Current Status</label>
        <div class="status-badge">${escapeHtml(app.status || 'submitted')}</div>
      </div>
    </div>

    <div class="section-title">1. Applicant Profile & Identity</div>
    <table class="data-table">
      <tr>
        <th>Applicant Full Name</th>
        <td><strong>${escapeHtml(app.applicantName)}</strong></td>
        <th>Date of Birth</th>
        <td>${dobStr}</td>
      </tr>
      <tr>
        <th>Gender</th>
        <td>${escapeHtml(app.gender || 'Not Specified')}</td>
        <th>Category / Quota</th>
        <td>${escapeHtml(app.category || 'General')}</td>
      </tr>
      <tr>
        <th>Father's / Guardian's Name</th>
        <td>${escapeHtml(app.fatherName || 'N/A')}</td>
        <th>Mother's Name</th>
        <td>${escapeHtml(app.motherName || 'N/A')}</td>
      </tr>
      <tr>
        <th>Contact Mobile</th>
        <td>${escapeHtml(app.phone)}</td>
        <th>Email Address</th>
        <td>${escapeHtml(app.email || 'N/A')}</td>
      </tr>
      <tr>
        <th>Permanent Address</th>
        <td colspan="3">
          ${escapeHtml(app.address?.street ? app.address.street + ', ' : '')}
          ${escapeHtml(app.address?.district || '')},
          ${escapeHtml(app.address?.state || 'Bihar')} - ${escapeHtml(app.address?.pincode || '')}
        </td>
      </tr>
    </table>

    <div class="section-title">2. Academic Merit Record</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Standard</th>
          <th>Board / Council</th>
          <th>Passing Year</th>
          <th>Aggregate / Score</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>10th / Secondary</strong></td>
          <td>${escapeHtml(app.academicDetails?.tenthBoard || 'N/A')}</td>
          <td>${app.academicDetails?.tenthYear || 'N/A'}</td>
          <td><strong>${app.academicDetails?.tenthPercentage || 'N/A'}%</strong></td>
        </tr>
        <tr>
          <td><strong>12th / Sr. Secondary</strong></td>
          <td>${escapeHtml(app.academicDetails?.twelfthBoard || 'N/A')}</td>
          <td>${app.academicDetails?.twelfthYear || 'N/A'}</td>
          <td>
            <strong>${app.academicDetails?.twelfthPercentage || 'N/A'}%</strong>
            ${app.academicDetails?.pcbPercentage ? ` (PCB: ${app.academicDetails.pcbPercentage}%)` : ''}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">3. Document Upload & Verification Status</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 70%;">Required Document</th>
          <th style="width: 30%; text-align: center;">Submission Status</th>
        </tr>
      </thead>
      <tbody>
        ${docList
          .map(
            d => `
          <tr>
            <td>${escapeHtml(d.name)}</td>
            <td style="text-align: center;">
              ${d.present ? '<span style="color: #16a34a; font-weight: 700;">&#10003; Uploaded</span>' : '<span style="color: #64748b;">Pending at Counseling</span>'}
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="declaration-box">
      <strong>Institutional Undertaking & Instructions:</strong>
      <ol style="margin-left: 18px; margin-top: 4px;">
        <li>This computer-generated application slip acknowledges receipt of preliminary candidate data.</li>
        <li>Final admission is subject to physical verification of original marksheets, caste/category certificate (if applicable), and medical fitness at the campus desk.</li>
        <li>Please retain this reference slip for counseling, merit listing, and all future communications.</li>
      </ol>
    </div>

    <div class="signatures-row">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Candidate Signature</div>
      </div>
      <div class="seal-box">
        Official<br>Seal
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Authorized Admissions Officer</div>
      </div>
    </div>
  </div>

</body>
</html>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  generateApplicationReceiptHtml,
  escapeHtml
};

