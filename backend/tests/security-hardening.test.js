'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { logAdminAction } = require('../src/services/auditLogger');
const { verifyWebhookSignature } = require('../src/middleware/verifyWebhookSignature');
const { authorizeRoles } = require('../src/middleware/authenticateAdmin');
const { lookupLimiter, exportLimiter } = require('../src/middleware/rateLimiter');
const { setCorsHeaders } = require('../../api/_cors');

describe('Security Hardening and Defensive Controls', () => {
  it('logAdminAction should produce structured audit entry with timestamp and IP', () => {
    const admin = { id: 'admin123', email: 'director@kavyashreenursing.edu.in', role: 'superadmin' };
    const entry = logAdminAction({
      admin,
      action: 'UPDATE_APPLICATION_STATUS',
      targetType: 'Application',
      targetId: 'app999',
      details: { newStatus: 'verified' },
      ip: '127.0.0.1'
    });

    assert.equal(entry.event, 'ADMIN_AUDIT');
    assert.equal(entry.admin.email, 'director@kavyashreenursing.edu.in');
    assert.equal(entry.admin.role, 'superadmin');
    assert.equal(entry.action, 'UPDATE_APPLICATION_STATUS');
    assert.equal(entry.targetType, 'Application');
    assert.equal(entry.targetId, 'app999');
    assert.equal(entry.ip, '127.0.0.1');
    assert.ok(entry.timestamp);
  });

  it('authorizeRoles should allow request when admin has permitted role', () => {
    const middleware = authorizeRoles('admin', 'superadmin');
    let nextCalled = false;
    const req = { admin: { role: 'superadmin' } };
    const res = {};

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
  });

  it('authorizeRoles should reject request with 403 when admin lacks permitted role', () => {
    const middleware = authorizeRoles('superadmin');
    let nextCalled = false;
    const req = { admin: { role: 'admin' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(data) {
        jsonSent = data;
      }
    };

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusSent, 403);
    assert.match(jsonSent.error, /superadmin/);
  });

  it('verifyWebhookSignature should accept valid HMAC-SHA256 signature', () => {
    const secret = 'test-audit-webhook-secret-key-12345';
    process.env.WEBHOOK_SECRET = secret;

    try {
      const payload = JSON.stringify({ event: 'lead_sync', id: '123' });
      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const req = {
        headers: {
          'x-signature-256': `sha256=${hmac}`
        },
        body: { event: 'lead_sync', id: '123' }
      };

      let statusSent = null;
      const res = {
        status(code) {
          statusSent = code;
          return this;
        },
        json() {}
      };

      let nextCalled = false;
      const middleware = verifyWebhookSignature('WEBHOOK_SECRET');
      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(statusSent, null);
    } finally {
      delete process.env.WEBHOOK_SECRET;
    }
  });

  it('verifyWebhookSignature should reject invalid or forged webhook signature with 403', () => {
    const secret = 'test-audit-webhook-secret-key-12345';
    process.env.WEBHOOK_SECRET = secret;

    try {
      const req = {
        headers: {
          'x-signature-256': 'sha256=invalidhash000000000000000000000000000000000000000000000000000000'
        },
        body: { event: 'lead_sync' }
      };

      let statusSent = null;
      let jsonSent = null;
      const res = {
        status(code) {
          statusSent = code;
          return this;
        },
        json(data) {
          jsonSent = data;
        }
      };

      let nextCalled = false;
      const middleware = verifyWebhookSignature('WEBHOOK_SECRET');
      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(statusSent, 403);
      assert.equal(jsonSent.success, false);
    } finally {
      delete process.env.WEBHOOK_SECRET;
    }
  });

  it('rate limiters for lookups and exports should be defined and active', () => {
    assert.ok(lookupLimiter, 'lookupLimiter must be defined');
    assert.ok(exportLimiter, 'exportLimiter must be defined');
  });

  it('setCorsHeaders should allow verified Vercel preview domain and deny arbitrary third-party origin', () => {
    const allowedReq = { headers: { origin: 'https://kavya-shree-nursing-preview-abc.vercel.app' } };
    const allowedHeaders = {};
    const allowedRes = {
      setHeader(k, v) {
        allowedHeaders[k] = v;
      }
    };

    setCorsHeaders(allowedReq, allowedRes);
    assert.equal(allowedHeaders['Access-Control-Allow-Origin'], 'https://kavya-shree-nursing-preview-abc.vercel.app');

    const blockedReq = { headers: { origin: 'https://malicious-phishing-site.example.com' } };
    const blockedHeaders = {};
    const blockedRes = {
      setHeader(k, v) {
        blockedHeaders[k] = v;
      }
    };

    setCorsHeaders(blockedReq, blockedRes);
    // Malicious origin must not be granted CORS access
    assert.notEqual(blockedHeaders['Access-Control-Allow-Origin'], 'https://malicious-phishing-site.example.com');
  });

  it('isSafeWebhookUrl and postWebhook should block SSRF targets (loopback, metadata, private IPs)', async () => {
    const { isSafeWebhookUrl } = require('../src/utils/common');
    const { postWebhook } = require('../src/services/automation.service');

    assert.equal(isSafeWebhookUrl('http://127.0.0.1:8080/internal'), false);
    assert.equal(isSafeWebhookUrl('http://localhost:5000/admin'), false);
    assert.equal(isSafeWebhookUrl('http://169.254.169.254/latest/meta-data/'), false);
    assert.equal(isSafeWebhookUrl('http://192.168.1.10/router'), false);
    assert.equal(isSafeWebhookUrl('http://10.0.0.5/private'), false);
    assert.equal(isSafeWebhookUrl('javascript:alert(1)'), false);
    assert.equal(isSafeWebhookUrl('https://hooks.zapier.com/hooks/catch/123/abc'), true);

    const ssrfAttempt = await postWebhook('http://169.254.169.254/latest/meta-data/', { test: 1 });
    assert.equal(ssrfAttempt, null);
  });

  it('isSafeDocumentUrl should allow valid HTTP(S) or relative paths and reject dangerous protocols', () => {
    const { isSafeDocumentUrl } = require('../src/utils/common');

    assert.equal(isSafeDocumentUrl(null), true);
    assert.equal(isSafeDocumentUrl(''), true);
    assert.equal(isSafeDocumentUrl('/uploads/marksheet-10th.pdf'), true);
    assert.equal(isSafeDocumentUrl('https://cdn.example.com/docs/photo.jpg'), true);
    assert.equal(isSafeDocumentUrl('javascript:alert(document.cookie)'), false);
    assert.equal(isSafeDocumentUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
    assert.equal(isSafeDocumentUrl('//evil.example.com/protocol-relative'), false);
  });

  it('syncDevAdmins should ensure default/seed admin accounts can always authenticate', async () => {
    const bcrypt = require('bcryptjs');
    const { syncDevAdmins } = require('../src/config/devStorage');

    const staleAdmins = [
      {
        _id: '671e6245d8b7a12345678900',
        id: '671e6245d8b7a12345678900',
        email: 'admin@edu.in',
        name: 'Institute Administrator',
        role: 'superadmin',
        passwords: [bcrypt.hashSync('old-forgotten-password-999', 10)]
      }
    ];

    const expectedPass = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || 'qwertyuiop123';
    const { admins, modified } = syncDevAdmins(staleAdmins);

    assert.equal(modified, true);
    const adminEdu = admins.find(a => a.email === 'admin@edu.in');
    const adminInst = admins.find(a => a.email === 'admin@kavyashreenursing.edu.in');
    assert.ok(adminEdu, 'admin@edu.in must exist');
    assert.ok(adminInst, 'admin@kavyashreenursing.edu.in must exist');
    assert.equal(adminEdu.isActive, true);
    assert.equal(
      adminEdu.passwords.some(h => bcrypt.compareSync(expectedPass, h)),
      true,
      'Updated password list must validate against configured seed password'
    );
  });
});

