'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('Public Content API', () => {
  it('GET /api/content/notices should return active institutional notices', async () => {
    const res = await request(app).get('/api/content/notices');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.match(res.headers['cache-control'], /public/);
  });

  it('GET /api/content/courses should return 5 advertised nursing courses', async () => {
    const res = await request(app).get('/api/content/courses');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 5);
  });

  it('GET /api/content/courses/:id should return single course details', async () => {
    const res = await request(app).get('/api/content/courses/gnm');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.data.title, /General Nursing/i);
  });

  it('GET /api/content/courses/unknown should return 404', async () => {
    const res = await request(app).get('/api/content/courses/unknown-course-xyz');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('GET /api/content/approvals should return affiliation documents', async () => {
    const res = await request(app).get('/api/content/approvals');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/content/gallery should return illustrative gallery categories', async () => {
    const res = await request(app).get('/api/content/gallery');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 4);
  });

  it('GET /api/content/faqs should return structured FAQ items', async () => {
    const res = await request(app).get('/api/content/faqs');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 5);
  });

  it('GET /api/content/downloads should return prospectus and form links', async () => {
    const res = await request(app).get('/api/content/downloads');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 2);
  });
});

