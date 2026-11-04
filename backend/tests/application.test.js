'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const config = require('../src/config/env');
const { Application } = require('../src/models/Application');
const { Admin } = require('../src/models/Admin');

describe('Online Applications API', () => {
  const superadminId = new mongoose.Types.ObjectId().toString();
  const validToken = jwt.sign(
    { id: superadminId, email: 'admin@kavyashreenursing.edu.in', name: 'Director', role: 'superadmin' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const mockAdminDoc = {
    _id: superadminId,
    id: superadminId,
    email: 'admin@kavyashreenursing.edu.in',
    name: 'Director',
    role: 'superadmin',
    isActive: true
  };

  const validApplicationPayload = {
    applicantName: 'Suman Kumari',
    gender: 'Female',
    dob: '2005-06-15',
    fatherName: 'Ram Kumar',
    motherName: 'Geeta Devi',
    phone: '9876543210',
    email: 'suman.kumari@example.com',
    category: 'General',
    address: {
      street: 'Hospital Road',
      district: 'Patna',
      state: 'Bihar',
      pincode: '800001'
    },
    program: 'Bachelor of Science in Nursing (B.Sc.)',
    academicDetails: {
      tenthBoard: 'BSEB',
      tenthYear: 2021,
      tenthPercentage: 82.5,
      twelfthBoard: 'BSEB',
      twelfthYear: 2023,
      twelfthPercentage: 78.4,
      pcbPercentage: 76.5
    },
    declaration: true
  };

  beforeEach(() => {
    mock.restoreAll();
    mock.method(Admin, 'findById', () => ({
      select: async () => mockAdminDoc,
      then: async (res) => res(mockAdminDoc)
    }));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('POST /api/applications should submit application and return reference number', async () => {
    const mockCreated = {
      _id: new mongoose.Types.ObjectId(),
      applicationNumber: 'KSIN-2026-APP-1234',
      applicantName: validApplicationPayload.applicantName,
      program: validApplicationPayload.program,
      createdAt: new Date()
    };
    mock.method(Application, 'create', async () => mockCreated);

    const res = await request(app)
      .post('/api/applications')
      .send(validApplicationPayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.applicationNumber);
    assert.equal(res.body.data.applicantName, validApplicationPayload.applicantName);
  });

  it('POST /api/applications should reject invalid phone number', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...validApplicationPayload, phone: '12345' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /10-digit/i);
  });

  it('POST /api/applications should silently discard honeypot submissions', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...validApplicationPayload, website: 'http://spambot.example.com' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  it('GET /api/applications/admin should list applications with pagination', async () => {
    mock.method(Application, 'countDocuments', async () => 1);
    mock.method(Application, 'find', () => ({
      sort: () => ({
        skip: () => ({
          limit: async () => [{
            id: 'app1',
            applicationNumber: 'KSIN-2026-APP-0001',
            applicantName: 'Suman Kumari',
            status: 'submitted'
          }]
        })
      })
    }));

    const res = await request(app)
      .get('/api/applications/admin')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.applications.length, 1);
  });

  it('GET /api/applications/admin/export should return CSV stream', async () => {
    mock.method(Application, 'find', () => ({
      sort: async () => [{
        applicationNumber: 'KSIN-2026-APP-0001',
        createdAt: new Date(),
        applicantName: 'Suman Kumari',
        gender: 'Female',
        dob: new Date('2005-06-15'),
        fatherName: 'Ram Kumar',
        motherName: 'Geeta Devi',
        phone: '9876543210',
        email: 'suman@example.com',
        category: 'General',
        address: { district: 'Patna', state: 'Bihar', pincode: '800001' },
        program: 'General Nursing & Midwifery (GNM)',
        status: 'submitted'
      }]
    }));

    const res = await request(app)
      .get('/api/applications/admin/export')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.text, /Application Number/);
    assert.match(res.text, /Suman Kumari/);
  });
});

