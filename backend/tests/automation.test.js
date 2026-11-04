'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const {
  postWebhook,
  sendTelegramAlert,
  sendLeadWebhook,
  notifyNewEnquiry,
  notifyNewApplication,
  notifyStatusTransition
} = require('../src/services/automation.service');

describe('Automation Service and Webhook Notifications', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mock.restoreAll();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    mock.restoreAll();
    process.env = { ...originalEnv };
  });

  it('postWebhook should return null for empty or invalid URL', async () => {
    const res1 = await postWebhook('', { test: true });
    assert.equal(res1, null);

    const res2 = await postWebhook(null, { test: true });
    assert.equal(res2, null);
  });

  it('sendTelegramAlert should return null when tokens are not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const res = await sendTelegramAlert('Test alert');
    assert.equal(res, null);
  });

  it('sendLeadWebhook should return null when WEBHOOK_LEAD_URL is unset', async () => {
    delete process.env.WEBHOOK_LEAD_URL;

    const res = await sendLeadWebhook({ event: 'test' });
    assert.equal(res, null);
  });

  it('notifyNewEnquiry should execute non-blocking without throwing uncaught errors', (t, done) => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    process.env.TELEGRAM_CHAT_ID = '123456789';
    process.env.WEBHOOK_LEAD_URL = 'https://example.com/mock-webhook';

    // Mock global fetch
    global.fetch = async (url, options) => {
      return { ok: true, status: 200 };
    };

    const mockEnquiry = {
      id: 'enq-101',
      name: 'Rohan Sharma',
      phone: '9876543210',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      email: 'rohan@example.com',
      message: 'Need hostel information',
      createdAt: new Date().toISOString()
    };

    assert.doesNotThrow(() => {
      notifyNewEnquiry(mockEnquiry);
    });

    // Verify after setImmediate tick
    setTimeout(done, 50);
  });

  it('notifyNewApplication should execute non-blocking and format application lead', (t, done) => {
    global.fetch = async (url, options) => {
      return { ok: true, status: 200 };
    };

    const mockApp = {
      applicationNumber: 'KSIN-2026-APP-7788',
      applicantName: 'Priya Kumari',
      phone: '9876543210',
      program: 'General Nursing & Midwifery (GNM)',
      address: { district: 'Patna', state: 'Bihar' },
      academicDetails: { tenthPercentage: 80, twelfthPercentage: 75, pcbPercentage: 72 },
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    assert.doesNotThrow(() => {
      notifyNewApplication(mockApp);
    });

    setTimeout(done, 50);
  });

  it('notifyStatusTransition should dispatch transition payload safely', (t, done) => {
    process.env.WEBHOOK_STATUS_URL = 'https://example.com/status-hook';
    let hookDispatched = false;

    global.fetch = async (url, options) => {
      if (url === 'https://example.com/status-hook') {
        hookDispatched = true;
      }
      return { ok: true, status: 200 };
    };

    notifyStatusTransition({
      entityType: 'Application',
      id: 'app-999',
      referenceNumber: 'KSIN-2026-APP-9999',
      previousStatus: 'submitted',
      newStatus: 'verified',
      candidateName: 'Pooja Singh',
      candidatePhone: '9876543210',
      adminUser: { name: 'Principal Officer', email: 'officer@example.com' }
    });

    setTimeout(() => {
      assert.equal(hookDispatched, true);
      done();
    }, 50);
  });
});
