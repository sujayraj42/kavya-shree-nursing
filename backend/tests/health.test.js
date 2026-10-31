'use strict';

const { describe, it, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Health and System Endpoints', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('GET /api/health should return 200 and healthy when database is connected', async () => {
    mock.method(db, 'getDatabaseStatus', () => 'connected');

    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
    assert.ok(res.body.timestamp);
    assert.equal(typeof res.body.uptime, 'number');

    // Ensure no database credentials or sensitive details are exposed
    const bodyStr = JSON.stringify(res.body);
    assert.equal(bodyStr.includes('mongodb'), false, 'Response must not contain MongoDB URI');
    assert.equal(bodyStr.includes('password'), false, 'Response must not leak passwords');
  });

  it('GET /api/health should return 503 and unhealthy when database is disconnected', async () => {
    mock.method(db, 'getDatabaseStatus', () => 'disconnected');

    const res = await request(app).get('/api/health');

    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'unhealthy');
    assert.equal(res.body.database, 'disconnected');
  });

  it('GET /api/nonexistent should return 404 with structured error', async () => {
    const res = await request(app).get('/api/nonexistent');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'API endpoint not found');
  });

  it('POST /api/enquiries with malformed JSON body should return 400', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .set('Content-Type', 'application/json')
      .send('{ "name": "Broken JSON');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Malformed JSON payload');
  });

  it('Render keep-alive ping scheduler should start and stop cleanly when configured', () => {
    const config = require('../src/config/env');
    const { startKeepAlivePing, stopKeepAlivePing } = require('../src/server');

    const prevEnabled = config.keepAliveEnabled;
    const prevUrl = config.keepAliveUrl;

    try {
      config.keepAliveEnabled = true;
      config.keepAliveUrl = 'https://kavya-shree-nursing.onrender.com';

      const timer = startKeepAlivePing();
      assert.ok(timer, 'Expected keep-alive interval timer to be created');
      clearInterval(timer);
      stopKeepAlivePing();
    } finally {
      config.keepAliveEnabled = prevEnabled;
      config.keepAliveUrl = prevUrl;
    }
  });
});
