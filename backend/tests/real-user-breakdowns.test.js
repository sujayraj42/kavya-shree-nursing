'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../src/app');
const config = require('../src/config/env');
const { Application } = require('../src/models/Application');
const { Enquiry } = require('../src/models/Enquiry');
const { Admin } = require('../src/models/Admin');
const { enquiryLimiter, lookupLimiter } = require('../src/middleware/rateLimiter');

describe('Real-World User Breakdown Prevention (10 Vectors)', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockEnquiryId = new mongoose.Types.ObjectId().toString();
  const validToken = jwt.sign(
    { id: mockAdminId, email: 'admin@kavyashreenursing.edu.in', role: 'admin' },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  const baseApplication = {
    applicantName: 'Priya Sharma',
    gender: 'Female',
    dob: '2004-05-15', // Age ~22 (valid)
    fatherName: 'Rajesh Sharma',
    motherName: 'Sunita Sharma',
    phone: '9876543210',
    email: 'priya.sharma@example.com',
    category: 'General',
    address: {
      street: '12 MG Road',
      district: 'Patna',
      state: 'Bihar',
      pincode: '800001'
    },
    academicDetails: {
      tenthBoard: 'BSEB',
      tenthYear: 2020,
      tenthPercentage: 82.5,
      twelfthBoard: 'BSEB',
      twelfthYear: 2022,
      twelfthPercentage: 85.0,
      pcbPercentage: 88.0
    },
    program: 'Bachelor of Science in Nursing (B.Sc.)',
    declaration: true
  };

  beforeEach(() => {
    mock.restoreAll();
    for (const ip of ['::ffff:127.0.0.1', '127.0.0.1', '::1']) {
      if (typeof enquiryLimiter.resetKey === 'function') enquiryLimiter.resetKey(ip);
      if (typeof lookupLimiter.resetKey === 'function') lookupLimiter.resetKey(ip);
    }
    mock.method(Admin, 'findById', () => ({
      select: async () => ({
        id: mockAdminId,
        email: 'admin@kavyashreenursing.edu.in',
        name: 'Admissions Officer',
        role: 'admin',
        isActive: true
      })
    }));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  // Vector 1: Rapid Double-Click / Race Condition
  it('Vector 1: should reject rapid duplicate application submissions with 409 Conflict', async () => {
    mock.method(Application, 'create', async (data) => ({
      _id: new mongoose.Types.ObjectId(),
      id: 'app_mock_1',
      applicationNumber: 'KSIN-2026-APP-99991111',
      ...data,
      createdAt: new Date()
    }));

    // First submission
    const res1 = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '9876500001' });

    assert.equal(res1.status, 201);
    assert.equal(res1.body.success, true);

    // Immediate second submission with identical candidate phone & program
    const res2 = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '9876500001' });

    assert.equal(res2.status, 409);
    assert.equal(res2.body.success, false);
    assert.match(res2.body.error, /duplicate/i);
  });

  // Vector 2: Phone Numbers with Country Code or Leading Zero
  it('Vector 2: should normalize phone numbers with +91, 91, or leading 0 to 10 digits', async () => {
    let savedPhone = null;
    mock.method(Application, 'create', async (data) => {
      savedPhone = data.phone;
      return {
        _id: new mongoose.Types.ObjectId(),
        id: 'app_mock_phone',
        applicationNumber: 'KSIN-2026-APP-PHONE01',
        ...data,
        createdAt: new Date()
      };
    });

    // Test with +91 prefix
    const resPlus91 = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '+91 98765 43211' });

    assert.equal(resPlus91.status, 201);
    assert.equal(savedPhone, '9876543211');

    // Test with leading 0 in application
    const resZero = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '09876543212' });

    assert.equal(resZero.status, 201);
    assert.equal(savedPhone, '9876543212');
  });

  // Vector 3: Nursing Age Limits (17 to 35 years)
  it('Vector 3: should reject applicants younger than 17 or older than 35 with 400', async () => {
    // Under 17 years old (e.g., born in 2014, age ~12)
    const resTooYoung = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '9876500003', dob: '2014-01-01' });

    assert.equal(resTooYoung.status, 400);
    assert.match(resTooYoung.body.error, /age|17/i);

    // Future date of birth
    const resFuture = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '9876500004', dob: '2030-01-01' });

    assert.equal(resFuture.status, 400);
    assert.match(resFuture.body.error, /date of birth|age/i);

    // Over 35 years old (e.g., born in 1980, age ~46)
    const resTooOld = await request(app)
      .post('/api/applications')
      .send({ ...baseApplication, phone: '9876500005', dob: '1980-01-01' });

    assert.equal(resTooOld.status, 400);
    assert.match(resTooOld.body.error, /age|35/i);
  });

  // Vector 4: Academic Percentage Boundary Breakdown
  it('Vector 4: should reject percentage values less than 0 or greater than 100 with 400', async () => {
    const resInvalidPCB = await request(app)
      .post('/api/applications')
      .send({
        ...baseApplication,
        phone: '9876500006',
        academicDetails: {
          ...baseApplication.academicDetails,
          pcbPercentage: 110.5
        }
      });

    assert.equal(resInvalidPCB.status, 400);
    assert.match(resInvalidPCB.body.error, /percentage/i);

    const resNegativeTenth = await request(app)
      .post('/api/applications')
      .send({
        ...baseApplication,
        phone: '9876500007',
        academicDetails: {
          ...baseApplication.academicDetails,
          tenthPercentage: -5
        }
      });

    assert.equal(resNegativeTenth.status, 400);
    assert.match(resNegativeTenth.body.error, /percentage/i);
  });

  // Vector 5: Indian Postal Pincode Validation
  it('Vector 5: should reject invalid Indian postal PIN codes with 400', async () => {
    const resAlphaPin = await request(app)
      .post('/api/applications')
      .send({
        ...baseApplication,
        phone: '9876500008',
        address: { ...baseApplication.address, pincode: '80000A' }
      });

    assert.equal(resAlphaPin.status, 400);
    assert.match(resAlphaPin.body.error, /pincode|pin code/i);

    const resShortPin = await request(app)
      .post('/api/applications')
      .send({
        ...baseApplication,
        phone: '9876500009',
        address: { ...baseApplication.address, pincode: '80001' } // 5 digits
      });

    assert.equal(resShortPin.status, 400);
    assert.match(resShortPin.body.error, /pincode|pin code/i);
  });

  // Vector 6: CSV / Excel Formula Injection (CWE-1236)
  it('Vector 6: should sanitize Excel formula triggers in CSV export', async () => {
    mock.method(Enquiry, 'find', () => ({
      sort: async () => [
        {
          _id: new mongoose.Types.ObjectId(),
          id: 'enq_formula',
          createdAt: new Date(),
          name: '=cmd|\' /C calc\'!A0',
          phone: '9876543210',
          email: 'test@example.com',
          program: 'Bachelor of Science in Nursing (B.Sc.)',
          status: 'new',
          consent: true,
          notes: [],
          message: '@SUM(1+1)*cmd'
        }
      ]
    }));

    const res = await request(app)
      .get('/api/admin/enquiries/export')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    // Formula triggers should be neutralized with prepended single quote (')
    assert.ok(res.text.includes("'\=cmd") || res.text.includes("'=cmd"));
    assert.ok(res.text.includes("'@SUM"));
  });

  // Vector 7: Query Parameter NoSQL / Type Confusion Injection
  it('Vector 7: should safely handle object/array injection in query parameters without 500', async () => {
    mock.method(Enquiry, 'countDocuments', async () => 0);
    mock.method(Enquiry, 'find', () => ({
      sort: () => ({
        skip: () => ({
          limit: async () => []
        })
      })
    }));

    const res = await request(app)
      .get('/api/admin/enquiries?search[$gt]=&status[$ne]=closed')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  // Vector 8: Stored XSS / HTML Injection in Admin Notes
  it('Vector 8: should strip script and HTML tags from admin notes', async () => {
    let savedNoteText = null;
    mock.method(Enquiry, 'findById', async () => ({
      _id: mockEnquiryId,
      id: mockEnquiryId,
      deletedAt: null,
      notes: [],
      save: async function () {
        savedNoteText = this.notes[0]?.text;
        return this;
      }
    }));

    const res = await request(app)
      .post(`/api/admin/enquiries/${mockEnquiryId}/notes`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ text: '<script>alert("xss")</script><b>Candidate verified</b> via phone call' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(!savedNoteText.includes('<script>'));
    assert.ok(!savedNoteText.includes('<b>'));
    assert.ok(savedNoteText.includes('Candidate verified via phone call'));
  });

  // Vector 9: Duplicate Application Reference Collision Handling
  it('Vector 9: should handle MongoDB duplicate key collision on applicationNumber with 409', async () => {
    mock.method(Application, 'create', async () => {
      const err = new Error('E11000 duplicate key error collection: kavya-shree.applications index: applicationNumber_1 dup key');
      err.code = 11000;
      throw err;
    });

    const res = await request(app)
      .post('/api/applications')
      .send({
        ...baseApplication,
        phone: '9876500010',
        applicationNumber: 'KSIN-2026-APP-COLLIDE'
      });

    // Should return clean 409 Conflict instead of 500 crash
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /already exists|duplicate/i);
  });

  // Vector 10: PII Privacy Protection on Public Receipt Endpoint
  it('Vector 10: should mask sensitive PII (phone, email, address) on public receipt unless authenticated', async () => {
    mock.method(Application, 'findOne', async () => ({
      applicationNumber: 'KSIN-2026-APP-PII01',
      applicantName: 'Anjali Verma',
      gender: 'Female',
      dob: new Date('2003-08-10'),
      fatherName: 'Sanjay Verma',
      motherName: 'Rekha Verma',
      phone: '9876543210',
      email: 'anjali.verma@example.com',
      address: {
        street: '45 Boring Road Flat 3B',
        district: 'Patna',
        state: 'Bihar',
        pincode: '800001'
      },
      academicDetails: {
        tenthBoard: 'CBSE',
        tenthYear: 2019,
        tenthPercentage: 88,
        twelfthBoard: 'CBSE',
        twelfthYear: 2021,
        twelfthPercentage: 85,
        pcbPercentage: 86
      },
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      createdAt: new Date(),
      documents: {}
    }));

    // Public request (no admin auth)
    const publicRes = await request(app)
      .get('/api/applications/KSIN-2026-APP-PII01/receipt');

    assert.equal(publicRes.status, 200);
    // Full raw phone & email should NOT be present in plain public HTML
    assert.ok(!publicRes.text.includes('9876543210'));
    assert.ok(publicRes.text.includes('******3210') || publicRes.text.includes('XXXXXX3210'));
    assert.ok(!publicRes.text.includes('anjali.verma@example.com'));
    assert.ok(publicRes.text.includes('a****@example.com') || publicRes.text.includes('a***@'));

    // Admin request (authenticated)
    const adminRes = await request(app)
      .get('/api/applications/admin/KSIN-2026-APP-PII01/receipt')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(adminRes.status, 200);
    // Unmasked phone & email should be present for authorized staff
    assert.ok(adminRes.text.includes('9876543210'));
    assert.ok(adminRes.text.includes('anjali.verma@example.com'));
  });
});
