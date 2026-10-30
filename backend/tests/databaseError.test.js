'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { Enquiry } = require('../src/models/Enquiry');
const mongoose = require('mongoose');

describe('Database Error Handling and Resiliency', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should return 503 Service Unavailable when MongoDB cluster selection times out', async () => {
    const mongoTimeoutError = new Error('Could not connect to any servers in your MongoDB Atlas cluster');
    mongoTimeoutError.name = 'MongoServerSelectionError';

    mock.method(Enquiry, 'create', async () => {
      throw mongoTimeoutError;
    });

    const payload = {
      name: 'Ananya Sharma',
      phone: '9876543210',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      consent: true
    };

    const res = await request(app)
      .post('/api/enquiries')
      .send(payload);

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Database service temporarily unavailable. Please try again later.');
    // Confirm no credentials or internal URI leaked in error response
    assert.equal(JSON.stringify(res.body).includes('mongodb'), false);
    assert.equal(JSON.stringify(res.body).includes('password'), false);
  });

  it('should return 500 Safe Error when unexpected database exception occurs', async () => {
    const dbError = new Error('Unexpected storage failure');
    dbError.name = 'MongoNetworkError';

    mock.method(Enquiry, 'create', async () => {
      throw dbError;
    });

    const payload = {
      name: 'Rahul Kumar',
      phone: '9876543210',
      program: 'General Nursing & Midwifery (GNM)',
      consent: true
    };

    const res = await request(app)
      .post('/api/enquiries')
      .send(payload);

    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    // Confirm error does not leak credentials or sensitive database connection strings
    assert.equal(JSON.stringify(res.body).includes('mongodb+srv'), false);
    assert.equal(JSON.stringify(res.body).includes('password'), false);
  });

  it('should return disconnected database status in /api/health when Mongoose is disconnected', async () => {
    // Current readyState in test environment is 0 (disconnected) because tests mock db operations
    assert.equal(mongoose.connection.readyState, 0);

    const res = await request(app)
      .get('/api/health');

    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'unhealthy');
    assert.equal(res.body.database, 'disconnected');
  });
});
