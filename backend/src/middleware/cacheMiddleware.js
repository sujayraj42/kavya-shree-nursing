'use strict';

const { cacheService } = require('../services/cache.service');

/**
 * Creates an Express caching middleware for GET requests.
 * @param {Object} options
 * @param {number} [options.ttl=300] Cache TTL in seconds.
 * @param {string} [options.prefix='api:'] Key namespace prefix.
 */
function cacheMiddleware(options = {}) {
  const ttl = options.ttl || 300;
  const prefix = options.prefix || 'api:';

  return async function (req, res, next) {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${prefix}${req.originalUrl || req.url}`;

    try {
      const cached = await cacheService.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    } catch {
      // Continue without cache on error
    }

    res.set('X-Cache', 'MISS');

    // Intercept res.json to capture and cache the response body
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
        cacheService.set(key, body, ttl).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = {
  cacheMiddleware
};

