'use strict';

const config = require('../config/env');

/**
 * Dispatches an HTTP POST request safely in the background with timeout and error handling.
 */
async function postWebhook(url, payload, { headers = {}, timeoutMs = 8000 } = {}) {
  if (!url || typeof url !== 'string') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KavyaShree-Automation-Service/1.0',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.warn(`[WARN] Automation webhook dispatch failed (${url}): ${err.message}`);
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Dispatches a formatted notification message to a Telegram chat via Bot API.
 */
async function sendTelegramAlert(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return null;
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  return postWebhook(endpoint, {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

/**
 * Dispatches a lead payload to an external CRM or Google Sheets webhook (Zapier, Make, n8n, Google Apps Script).
 */
async function sendLeadWebhook(payload) {
  const webhookUrl = process.env.WEBHOOK_LEAD_URL;
  if (!webhookUrl) {
    return null;
  }
  return postWebhook(webhookUrl, payload);
}

/**
 * Handles automated alerts and integrations when a new enquiry is submitted.
 * Non-blocking: executes via setImmediate so applicant HTTP response is never delayed.
 */
function notifyNewEnquiry(enquiry) {
  setImmediate(async () => {
    try {
      const nowStr = new Date(enquiry.createdAt || Date.now()).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      });

      const telegramMsg = [
        '<b>🚨 NEW ADMISSION ENQUIRY</b>',
        `<b>Institute:</b> Kavya Shree Institute of Nursing`,
        `<b>Candidate:</b> ${enquiry.name || 'N/A'}`,
        `<b>Phone:</b> <code>${enquiry.phone || 'N/A'}</code>`,
        `<b>Course:</b> ${enquiry.program || 'N/A'}`,
        enquiry.email ? `<b>Email:</b> ${enquiry.email}` : null,
        enquiry.message ? `<b>Note:</b> <i>${enquiry.message.slice(0, 200)}</i>` : null,
        `<b>Time:</b> ${nowStr}`
      ]
        .filter(Boolean)
        .join('\n');

      const leadPayload = {
        event: 'new_enquiry',
        timestamp: new Date().toISOString(),
        leadType: 'Enquiry',
        data: {
          id: enquiry.id || enquiry._id,
          name: enquiry.name,
          phone: enquiry.phone,
          email: enquiry.email || '',
          program: enquiry.program,
          message: enquiry.message || '',
          source: enquiry.source || 'Website Enquiry Form',
          createdAt: enquiry.createdAt
        }
      };

      await Promise.allSettled([
        sendTelegramAlert(telegramMsg),
        sendLeadWebhook(leadPayload)
      ]);
    } catch (err) {
      console.warn(`[WARN] notifyNewEnquiry automation failed: ${err.message}`);
    }
  });
}

/**
 * Handles automated alerts and integrations when a new online application is submitted.
 * Non-blocking: executes asynchronously.
 */
function notifyNewApplication(application) {
  setImmediate(async () => {
    try {
      const nowStr = new Date(application.createdAt || Date.now()).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      });

      const telegramMsg = [
        '<b>🎓 NEW ONLINE ADMISSION APPLICATION</b>',
        `<b>Application No:</b> <code>${application.applicationNumber}</code>`,
        `<b>Applicant:</b> ${application.applicantName}`,
        `<b>Phone:</b> <code>${application.phone}</code>`,
        `<b>Program:</b> ${application.program}`,
        `<b>District:</b> ${application.address?.district || 'N/A'}, ${application.address?.state || 'Bihar'}`,
        `<b>10th Marks:</b> ${application.academicDetails?.tenthPercentage || 'N/A'}%`,
        `<b>12th Marks:</b> ${application.academicDetails?.twelfthPercentage || 'N/A'}% (PCB: ${application.academicDetails?.pcbPercentage || 'N/A'}%)`,
        `<b>Time:</b> ${nowStr}`
      ].join('\n');

      const leadPayload = {
        event: 'new_application',
        timestamp: new Date().toISOString(),
        leadType: 'Online Application',
        data: {
          id: application.id || application._id,
          applicationNumber: application.applicationNumber,
          applicantName: application.applicantName,
          gender: application.gender,
          phone: application.phone,
          email: application.email,
          program: application.program,
          district: application.address?.district,
          state: application.address?.state,
          tenthPercentage: application.academicDetails?.tenthPercentage,
          twelfthPercentage: application.academicDetails?.twelfthPercentage,
          pcbPercentage: application.academicDetails?.pcbPercentage,
          status: application.status,
          createdAt: application.createdAt
        }
      };

      await Promise.allSettled([
        sendTelegramAlert(telegramMsg),
        sendLeadWebhook(leadPayload)
      ]);
    } catch (err) {
      console.warn(`[WARN] notifyNewApplication automation failed: ${err.message}`);
    }
  });
}

/**
 * Handles automated audit logging and webhooks when an application or enquiry status changes.
 */
function notifyStatusTransition({
  entityType,
  id,
  referenceNumber,
  previousStatus,
  newStatus,
  candidateName,
  candidatePhone,
  adminUser
}) {
  setImmediate(async () => {
    try {
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const auditPayload = {
        event: 'status_transition',
        timestamp: new Date().toISOString(),
        entityType,
        id,
        referenceNumber: referenceNumber || null,
        candidateName,
        candidatePhone,
        previousStatus,
        newStatus,
        updatedBy: adminUser?.email || 'admin'
      };

      const webhookUrl = process.env.WEBHOOK_STATUS_URL || process.env.WEBHOOK_LEAD_URL;
      if (webhookUrl) {
        await postWebhook(webhookUrl, auditPayload);
      }

      // If status reaches 'verified' or 'admitted', send priority alert
      if (['verified', 'admitted', 'shortlisted'].includes(newStatus)) {
        const text = [
          `<b>✅ APPLICATION STATUS UPDATED</b>`,
          `<b>Ref:</b> <code>${referenceNumber || id}</code>`,
          `<b>Candidate:</b> ${candidateName || 'N/A'}`,
          `<b>Status:</b> <b>${newStatus.toUpperCase()}</b> (was: ${previousStatus || 'N/A'})`,
          `<b>Officer:</b> ${adminUser?.name || adminUser?.email || 'Admin'}`,
          `<b>Time:</b> ${nowStr}`
        ].join('\n');
        await sendTelegramAlert(text);
      }
    } catch (err) {
      console.warn(`[WARN] notifyStatusTransition failed: ${err.message}`);
    }
  });
}

module.exports = {
  postWebhook,
  sendTelegramAlert,
  sendLeadWebhook,
  notifyNewEnquiry,
  notifyNewApplication,
  notifyStatusTransition
};

