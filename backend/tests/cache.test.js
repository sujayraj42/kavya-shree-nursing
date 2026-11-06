'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { CacheService, cacheService } = require('../src/services/cache.service');
const { cacheMiddleware } = require('../src/middleware/cacheMiddleware');

describe('Cache Service and Redis Resiliency', () => {
  let cache;

  beforeEach(async () => {
    cache = new CacheService();
    await cache.flush();
  });

  test('set and get should store and retrieve JSON objects', async () => {
    const testData = { college: 'Kavya Shree Institute', year: 2026, active: true };
    await cache.set('test:key1', testData, 10);

    const retrieved = await cache.get('test:key1');
    assert.deepEqual(retrieved, testData);
  });

  test('get should return null for non-existent key', async () => {
    const res = await cache.get('nonexistent:key');
    assert.equal(res, null);
  });

  test('del should remove specific key', async () => {
    await cache.set('delete:me', { status: 'ok' }, 10);
    assert.notEqual(await cache.get('delete:me'), null);

    await cache.del('delete:me');
    assert.equal(await cache.get('delete:me'), null);
  });

  test('delPattern should delete keys matching wildcard pattern', async () => {
    await cache.set('content:notices', [1, 2, 3], 10);
    await cache.set('content:courses', ['ANM', 'GNM'], 10);
    await cache.set('stats:dashboard', { total: 5 }, 10);

    await cache.delPattern('content:*');

    assert.equal(await cache.get('content:notices'), null);
    assert.equal(await cache.get('content:courses'), null);
    assert.notEqual(await cache.get('stats:dashboard'), null);
  });

  test('expired keys should return null after TTL expires', async () => {
    // Inject key with 1ms TTL
    cache.memoryCache.set('short:lived', {
      value: 'expired',
      expiresAt: Date.now() - 100
    });

    const res = await cache.get('short:lived');
    assert.equal(res, null);
  });

  test('cacheMiddleware should set X-Cache MISS on first request and HIT on subsequent request', async () => {
    const middleware = cacheMiddleware({ ttl: 60, prefix: 'mw:' });

    let cachedResponse = null;
    const req = { method: 'GET', originalUrl: '/api/test-route' };
    
    // First call: MISS
    const headers1 = {};
    const res1 = {
      statusCode: 200,
      set: (k, v) => { headers1[k] = v; },
      json: (body) => { cachedResponse = body; return body; }
    };

    await new Promise(resolve => middleware(req, res1, () => {
      res1.json({ success: true, message: 'fresh data' });
      resolve();
    }));

    assert.equal(headers1['X-Cache'], 'MISS');
    assert.deepEqual(cachedResponse, { success: true, message: 'fresh data' });

    // Second call: HIT
    const headers2 = {};
    let hitPayload = null;
    const res2 = {
      statusCode: 200,
      set: (k, v) => { headers2[k] = v; },
      status: (code) => ({
        json: (body) => { hitPayload = body; return body; }
      }),
      json: (body) => { hitPayload = body; return body; }
    };

    await middleware(req, res2, () => {});

    assert.equal(headers2['X-Cache'], 'HIT');
    assert.deepEqual(hitPayload, { success: true, message: 'fresh data' });
  });

  test('cacheMiddleware should bypass non-GET requests', async () => {
    const middleware = cacheMiddleware();
    const req = { method: 'POST', originalUrl: '/api/enquiries' };
    let calledNext = false;
    const res = {};

    await middleware(req, res, () => { calledNext = true; });
    assert.equal(calledNext, true);
  });
});

