'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { ContentItem } = require('../models/Content');
const { FALLBACK_CONTENT } = require('../data/fallbackContent');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

const contentRedisCache = cacheMiddleware({ ttl: 600, prefix: 'content:' });

/**
 * Generic content resolver that queries MongoDB first when connected, falling back to static structured data.
 */
async function resolveContent(section) {
  if (mongoose.connection.readyState === 1) {
    try {
      const items = await ContentItem.find({ section, isActive: true }).sort({ order: 1, createdAt: 1 });
      if (items && items.length > 0) {
        return items;
      }
    } catch (error) {
      // If table is empty or error occurs, smoothly fallback
    }
  }
  return FALLBACK_CONTENT[section] || [];
}

// Caching middleware for static/content responses (5 minutes browser cache, 10 minutes CDN)
function contentCache(req, res, next) {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
  next();
}

router.get('/notices', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('notices');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/courses', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('courses');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/courses/:id', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const courses = await resolveContent('courses');
    const course = courses.find(c => c.id === req.params.id || (c.data && c.data.code && c.data.code.toLowerCase() === req.params.id.toLowerCase()));
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

router.get('/approvals', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('approvals');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/faculty', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('faculty');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/hospital-tieups', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('hospitalTieups');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/gallery', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('gallery');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/faqs', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('faqs');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/downloads', contentCache, contentRedisCache, async (req, res, next) => {
  try {
    const data = await resolveContent('downloads');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
