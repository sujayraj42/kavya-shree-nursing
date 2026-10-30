'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { Enquiry } = require('../src/models/Enquiry');
const enquiryRoutes = require('../src/routes/enquiry.routes');
const { enquiryLimiter } = require('../src/middleware/rateLimiter');

describe('Enquiry Submission and Server-Side Validation', () => {
  let createMock;

  beforeEach(() => {
    enquiryRoutes.clearRecentSubmissions();
    if (typeof enquiryLimiter.resetKey === 'function') {
      enquiryLimiter.resetKey('::ffff:127.0.0.1');
      enquiryLimiter.resetKey('127.0.0.1');
      enquiryLimiter.resetKey('::1');
    }
    createMock = mock.method(Enquiry, 'create', async data => ({
      id: 'mock-enquiry-id-507f1f77bcf86cd799439011',
      name: data.name,
      phone: data.phone,
      email: data.email,
      program: data.program,
      message: data.message,
      consent: data.consent,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  });

  afterEach(() => {
    enquiryRoutes.clearRecentSubmissions();
    mock.restoreAll();
  });

  it('POST /api/enquiries should successfully register a valid enquiry with required fields', async () => {
    const payload = {
      name: 'Ananya Sharma',
      phone: '9661666485',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      consent: true
    };

    const res = await request(app)
      .post('/api/enquiries')
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Enquiry registered successfully');
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.program, 'Bachelor of Science in Nursing (B.Sc.)');
    assert.equal(res.body.data.status, 'new');
    assert.equal(createMock.mock.callCount(), 1);

    // Verify phone was normalized
    const passedData = createMock.mock.calls[0].arguments[0];
    assert.equal(passedData.phone, '9661666485');
    assert.equal(passedData.email, null);
  });

  it('POST /api/enquiries should accept valid enquiry with optional email and message', async () => {
    const payload = {
      name: 'Rahul Verma',
      phone: '+91 62878 79239',
      email: 'Rahul.Verma@Example.COM ',
      program: 'Auxiliary Nursing & Midwifery (ANM)',
      message: 'Inquiring about 2026 session commencement and hostel facilities.',
      consent: true
    };

    const res = await request(app)
      .post('/api/enquiries')
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(createMock.mock.callCount(), 1);

    const passedData = createMock.mock.calls[0].arguments[0];
    assert.equal(passedData.phone, '916287879239'); // digits only normalized
    assert.equal(passedData.email, 'rahul.verma@example.com'); // lowercased & trimmed
    assert.equal(passedData.message, 'Inquiring about 2026 session commencement and hostel facilities.');
  });

  it('POST /api/enquiries should sanitize HTML tags in candidate name and message', async () => {
    const payload = {
      name: '<script>alert("xss")</script>Dr. Priya Singh<b>RN</b>',
      phone: '9876543210',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      message: 'Inquiry with <img src=x onerror=alert(1)> embedded tags.',
      consent: true
    };

    const res = await request(app)
      .post('/api/enquiries')
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);

    const passedData = createMock.mock.calls[0].arguments[0];
    assert.equal(passedData.name, 'alert("xss")Dr. Priya SinghRN');
    assert.equal(passedData.message, 'Inquiry with  embedded tags.');
  });

  it('POST /api/enquiries should reject request with missing name', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        phone: '9661666485',
        program: 'General Nursing & Midwifery (GNM)',
        consent: true
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(res.body.errors.some(e => e.field === 'name'));
    assert.equal(createMock.mock.callCount(), 0);
  });

  it('POST /api/enquiries should reject request with name shorter than 2 characters', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'A',
        phone: '9661666485',
        program: 'General Nursing & Midwifery (GNM)',
        consent: true
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'name' && e.message.includes('at least 2 characters')));
  });

  it('POST /api/enquiries should reject phone with fewer than 10 digits', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Pooja Kumari',
        phone: '98765',
        program: 'Post Basic B.Sc. Nursing',
        consent: true
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'phone' && e.message.includes('at least 10 digits')));
  });

  it('POST /api/enquiries should reject syntactically invalid email', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Pooja Kumari',
        phone: '9876543210',
        email: 'invalid-email-no-at-sign',
        program: 'Post Basic B.Sc. Nursing',
        consent: true
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'email'));
  });

  it('POST /api/enquiries should reject invalid unadvertised program', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Pooja Kumari',
        phone: '9876543210',
        program: 'MBBS Doctor of Medicine', // unadvertised course
        consent: true
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'program'));
  });

  it('POST /api/enquiries should reject when consent is not granted', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Pooja Kumari',
        phone: '9876543210',
        program: 'Master of Science in Nursing (M.Sc.)',
        consent: false
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'consent'));
  });

  it('POST /api/enquiries should reject message exceeding 1000 characters', async () => {
    const longMessage = 'A'.repeat(1005);
    const res = await request(app)
      .post('/api/enquiries')
      .send({
        name: 'Pooja Kumari',
        phone: '9876543210',
        program: 'Master of Science in Nursing (M.Sc.)',
        message: longMessage,
        consent: true
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => e.field === 'message'));
  });

  it('POST /api/enquiries should reject duplicate rapid submissions with 409 Conflict', async () => {
    const payload = {
      name: 'Kiran Devi',
      phone: '9876501234',
      program: 'General Nursing & Midwifery (GNM)',
      consent: true
    };

    const firstRes = await request(app)
      .post('/api/enquiries')
      .set('X-Forwarded-For', '203.0.113.55')
      .send(payload);
    assert.equal(firstRes.status, 201);
    assert.equal(createMock.mock.callCount(), 1);

    const duplicateRes = await request(app)
      .post('/api/enquiries')
      .set('X-Forwarded-For', '203.0.113.55')
      .send(payload);
    assert.equal(duplicateRes.status, 409);
    assert.equal(duplicateRes.body.success, false);
    assert.ok(duplicateRes.body.error.includes('Duplicate enquiry detected'));
    assert.equal(createMock.mock.callCount(), 1);
  });
});
