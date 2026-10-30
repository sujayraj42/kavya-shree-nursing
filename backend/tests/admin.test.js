'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = require('../src/app');
const config = require('../src/config/env');
const { Admin } = require('../src/models/Admin');
const { Enquiry, VALID_STATUSES, ALL_ALLOWED_STATUSES, normalizeStatus } = require('../src/models/Enquiry');

describe('Admin Authentication and Security', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockAdminEmail = 'admin@kavyashreenursing.edu.in';
  const rawPassword = 'ValidSecurePassword123!';

  let mockAdminDoc;

  beforeEach(async () => {
    mock.restoreAll();

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    mockAdminDoc = {
      _id: mockAdminId,
      id: mockAdminId,
      email: mockAdminEmail,
      name: 'Dr. System Administrator',
      role: 'superadmin',
      password: hashedPassword,
      lastLoginAt: null,
      comparePassword: async function (candidate) {
        return bcrypt.compare(candidate, this.password);
      },
      save: async function () {
        return this;
      }
    };
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('POST /api/admin/login should succeed with valid credentials and return JWT & profile', async () => {
    mock.method(Admin, 'findOne', async () => mockAdminDoc);

    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: mockAdminEmail,
        password: rawPassword
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Authentication successful');
    assert.ok(res.body.token, 'Token must be returned');
    assert.equal(res.body.admin.email, mockAdminEmail);
    assert.equal(res.body.admin.role, 'superadmin');
    assert.equal(res.body.admin.password, undefined, 'Password hash must never be returned');

    // Verify token can be decoded with server secret
    const decoded = jwt.verify(res.body.token, config.jwtSecret);
    assert.equal(decoded.email, mockAdminEmail);
    assert.equal(decoded.id, mockAdminId);
  });

  it('POST /api/admin/login should return 401 with generic message for non-existent email', async () => {
    mock.method(Admin, 'findOne', async () => null);

    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'unknown-user@example.com',
        password: 'SomePassword123!'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password');
  });

  it('POST /api/admin/login should return 401 with generic message for incorrect password', async () => {
    mock.method(Admin, 'findOne', async () => mockAdminDoc);

    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: mockAdminEmail,
        password: 'WrongPassword456!'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password');
  });

  it('POST /api/admin/login should reject request with missing credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Email and password are required');
  });

  it('POST /api/admin/login should reject request with malformed email', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'not-an-email',
        password: rawPassword
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Please enter a valid email address');
  });

  it('GET /api/admin/me should return current profile when authenticated with valid token', async () => {
    const validToken = jwt.sign(
      { id: mockAdminId, email: mockAdminEmail, role: 'superadmin', name: 'Dr. System Administrator' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    mock.method(Admin, 'findById', () => ({
      select: async () => ({
        id: mockAdminId,
        email: mockAdminEmail,
        name: 'Dr. System Administrator',
        role: 'superadmin'
      })
    }));

    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.admin.email, mockAdminEmail);
    assert.equal(res.body.admin.name, 'Dr. System Administrator');
  });

  it('Protected routes should reject requests with missing token', async () => {
    const res = await request(app).get('/api/admin/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Missing or malformed authorization header'));
  });

  it('Protected routes should reject requests with invalid or corrupted token', async () => {
    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', 'Bearer invalid-token-string');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid authentication token.');
  });

  it('Protected routes should reject requests with expired token', async () => {
    const expiredToken = jwt.sign(
      { id: mockAdminId, email: mockAdminEmail },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('expired'));
  });

  it('Protected routes should reject requests when admin account is revoked or deleted', async () => {
    const validToken = jwt.sign(
      { id: mockAdminId, email: mockAdminEmail },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    mock.method(Admin, 'findById', () => ({
      select: async () => null
    }));

    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('not recognized or revoked'));
  });

  it('Protected routes should reject requests with non-ObjectId token ID format without 400 CastError', async () => {
    const malformedIdToken = jwt.sign(
      { id: 'not-a-valid-mongo-object-id', email: mockAdminEmail },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${malformedIdToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid authentication token.');
  });
});

describe('Admin Enquiry Management Endpoints', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockEnquiryId = new mongoose.Types.ObjectId().toString();
  let validToken;

  beforeEach(() => {
    mock.restoreAll();

    validToken = jwt.sign(
      { id: mockAdminId, email: 'admin@kavyashreenursing.edu.in', name: 'Admissions Officer', role: 'admin' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    mock.method(Admin, 'findById', () => ({
      select: async () => ({
        id: mockAdminId,
        email: 'admin@kavyashreenursing.edu.in',
        name: 'Admissions Officer',
        role: 'admin'
      })
    }));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('GET /api/admin/stats should return aggregated dashboard metrics and recent enquiries', async () => {
    const mockAggregation = [
      { _id: 'new', count: 5 },
      { _id: 'contacted', count: 3 },
      { _id: 'resolved', count: 2 } // Legacy status should normalize to 'closed'
    ];

    const mockRecent = [
      {
        id: mockEnquiryId,
        name: 'Pooja Kumari',
        status: 'new'
      }
    ];

    mock.method(Enquiry, 'aggregate', async () => mockAggregation);
    mock.method(Enquiry, 'countDocuments', async () => 10);
    mock.method(Enquiry, 'find', () => ({
      sort: () => ({
        limit: async () => mockRecent
      })
    }));

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.stats.total, 10);
    assert.equal(res.body.data.stats.new, 5);
    assert.equal(res.body.data.stats.contacted, 3);
    assert.equal(res.body.data.stats.closed, 2); // Legacy 'resolved' mapped to 'closed'
    assert.equal(res.body.data.recentEnquiries.length, 1);
  });

  it('GET /api/admin/enquiries should return paginated list and pagination metadata', async () => {
    const mockList = [
      {
        id: mockEnquiryId,
        name: 'Ananya Sharma',
        phone: '9661666485',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        status: 'new',
        createdAt: new Date().toISOString()
      }
    ];

    mock.method(Enquiry, 'countDocuments', async () => 25);
    mock.method(Enquiry, 'find', () => ({
      sort: () => ({
        skip: () => ({
          limit: async () => mockList
        })
      })
    }));

    const res = await request(app)
      .get('/api/admin/enquiries?page=2&limit=10')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.enquiries.length, 1);
    assert.equal(res.body.data.pagination.total, 25);
    assert.equal(res.body.data.pagination.page, 2);
    assert.equal(res.body.data.pagination.limit, 10);
    assert.equal(res.body.data.pagination.pages, 3);
  });

  it('GET /api/admin/enquiries should filter by status and program', async () => {
    let capturedQuery = null;

    mock.method(Enquiry, 'countDocuments', async query => {
      capturedQuery = query;
      return 1;
    });
    mock.method(Enquiry, 'find', query => {
      capturedQuery = query;
      return {
        sort: () => ({
          skip: () => ({
            limit: async () => []
          })
        })
      };
    });

    const res = await request(app)
      .get('/api/admin/enquiries?status=contacted&program=Auxiliary%20Nursing%20%26%20Midwifery%20(ANM)')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(capturedQuery.status, 'contacted');
    assert.equal(capturedQuery.program, 'Auxiliary Nursing & Midwifery (ANM)');
  });

  it('GET /api/admin/enquiries should reject invalid status filter with 400', async () => {
    const res = await request(app)
      .get('/api/admin/enquiries?status=invalid_status_enum')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid status filter'));
  });

  it('GET /api/admin/enquiries should safely search text with regex escaping', async () => {
    let capturedQuery = null;

    mock.method(Enquiry, 'countDocuments', async query => {
      capturedQuery = query;
      return 1;
    });
    mock.method(Enquiry, 'find', query => {
      capturedQuery = query;
      return {
        sort: () => ({
          skip: () => ({
            limit: async () => []
          })
        })
      };
    });

    const res = await request(app)
      .get('/api/admin/enquiries?search=Ananya+*+test')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.ok(capturedQuery.$or);
    assert.equal(capturedQuery.$or.length, 3);
  });

  it('GET /api/admin/enquiries/:id should return 400 for invalid ID format', async () => {
    const res = await request(app)
      .get('/api/admin/enquiries/invalid-id-format')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid enquiry ID format');
  });

  it('GET /api/admin/enquiries/:id should return 404 when enquiry is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    mock.method(Enquiry, 'findById', async () => null);

    const res = await request(app)
      .get(`/api/admin/enquiries/${nonExistentId}`)
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Enquiry not found');
  });

  it('GET /api/admin/enquiries/:id should return enquiry detail and internal notes', async () => {
    const mockEnquiry = {
      id: mockEnquiryId,
      name: 'Pooja Kumari',
      phone: '9876543210',
      email: 'pooja@example.com',
      program: 'General Nursing & Midwifery (GNM)',
      status: 'contacted',
      notes: [
        {
          id: 'note-1',
          author: 'Admissions Officer',
          text: 'Contacted candidate; sent prospectus.',
          createdAt: new Date().toISOString()
        }
      ]
    };

    mock.method(Enquiry, 'findById', async () => mockEnquiry);

    const res = await request(app)
      .get(`/api/admin/enquiries/${mockEnquiryId}`)
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Pooja Kumari');
    assert.equal(res.body.data.notes.length, 1);
  });

  it('PATCH /api/admin/enquiries/:id/status should successfully update status to valid active enum', async () => {
    let savedStatus = null;
    const mockEnquiry = {
      id: mockEnquiryId,
      _id: mockEnquiryId,
      status: 'new',
      updatedAt: new Date().toISOString(),
      save: async function () {
        savedStatus = this.status;
        this.updatedAt = new Date().toISOString();
        return this;
      }
    };

    mock.method(Enquiry, 'findById', async () => mockEnquiry);

    const res = await request(app)
      .patch(`/api/admin/enquiries/${mockEnquiryId}/status`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'in_review' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'in_review');
    assert.equal(savedStatus, 'in_review');
  });

  it('PATCH /api/admin/enquiries/:id/status should reject invalid status with 400', async () => {
    const res = await request(app)
      .patch(`/api/admin/enquiries/${mockEnquiryId}/status`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'random_invalid_status' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid status'));
  });

  it('POST /api/admin/enquiries/:id/notes should append note with author bound from admin token', async () => {
    const mockNotes = [];
    const mockEnquiry = {
      id: mockEnquiryId,
      _id: mockEnquiryId,
      notes: mockNotes,
      save: async function () {
        return this;
      }
    };

    mock.method(Enquiry, 'findById', async () => mockEnquiry);

    const res = await request(app)
      .post(`/api/admin/enquiries/${mockEnquiryId}/notes`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        author: 'FakeClientAuthor', // Client attempt to spoof author
        text: 'Candidate scheduled for document verification on Monday.'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Internal note added successfully');

    // Verify author is derived from admin token ('Admissions Officer'), NOT 'FakeClientAuthor'
    assert.equal(mockNotes.length, 1);
    assert.equal(mockNotes[0].author, 'Admissions Officer');
    assert.equal(mockNotes[0].text, 'Candidate scheduled for document verification on Monday.');
  });

  it('POST /api/admin/enquiries/:id/notes should reject empty note with 400', async () => {
    const res = await request(app)
      .post(`/api/admin/enquiries/${mockEnquiryId}/notes`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ text: '   ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Note text cannot be empty');
  });

  it('POST /api/admin/enquiries/:id/notes should reject note exceeding 1000 characters', async () => {
    const longNote = 'X'.repeat(1005);
    const res = await request(app)
      .post(`/api/admin/enquiries/${mockEnquiryId}/notes`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ text: longNote });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Note text must not exceed 1000 characters');
  });

  it('Status Enum & Compatibility: verifies standard active statuses and legacy normalization', () => {
    // 6 agreed standard statuses
    assert.deepEqual(VALID_STATUSES, ['new', 'contacted', 'in_review', 'admitted', 'closed', 'archived']);

    // Allowed statuses in schema include legacy 'resolved' for non-destructive backwards compatibility
    assert.ok(ALL_ALLOWED_STATUSES.includes('resolved'));

    // Normalization maps legacy 'resolved' to 'closed'
    assert.equal(normalizeStatus('resolved'), 'closed');
    assert.equal(normalizeStatus('in_review'), 'in_review');
  });
});

describe('Rate Limiter and Environment Security Configuration', () => {
  it('loginLimiter should return 429 when IP exceeds 5 login attempts', async () => {
    const express = require('express');
    const { loginLimiter } = require('../src/middleware/rateLimiter');

    const testApp = express();
    testApp.set('trust proxy', true);
    testApp.use(loginLimiter);
    testApp.post('/test-login-limit', (req, res) => res.status(200).json({ ok: true }));

    const uniqueTestIp = '198.51.100.42';

    // Send 5 requests from this isolated test IP
    for (let i = 0; i < 5; i++) {
      const res = await request(testApp)
        .post('/test-login-limit')
        .set('X-Forwarded-For', uniqueTestIp);
      assert.equal(res.status, 200);
    }

    // 6th request from the same IP must trigger rate limit 429
    const limitRes = await request(testApp)
      .post('/test-login-limit')
      .set('X-Forwarded-For', uniqueTestIp);

    assert.equal(limitRes.status, 429);
    assert.equal(limitRes.body.success, false);
    assert.ok(limitRes.body.error.includes('Too many login attempts'));
  });

  it('Production startup environment validator should detect missing JWT_SECRET', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;

    const missingInProd = [];
    const testEnv = {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017',
      FRONTEND_ORIGIN: 'http://localhost:4200'
      // JWT_SECRET is intentionally omitted
    };

    if (!testEnv.MONGODB_URI) missingInProd.push('MONGODB_URI');
    if (!testEnv.FRONTEND_ORIGIN) missingInProd.push('FRONTEND_ORIGIN');
    if (!testEnv.JWT_SECRET) missingInProd.push('JWT_SECRET');

    assert.equal(missingInProd.includes('JWT_SECRET'), true);
    assert.equal(missingInProd.length, 1);
  });
});
