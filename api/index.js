'use strict';

const { setCorsHeaders } = require('./_cors');

/**
 * Vercel Serverless Function: API Directory & Health Index
 * Provides instant institutional API routing & health discovery.
 */
module.exports = (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: true,
    name: 'Kavya Shree Institute of Nursing API',
    institution: 'Kavya Shree Institute of Nursing',
    accreditation: 'Statutory affiliation application submitted to Indian Nursing Council (INC) & Bihar Nurses Registration Council (BNRC) for Session 2026-27',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      applications: '/api/applications',
      enquiries: '/api/enquiries',
      courses: '/api/content/courses',
      notices: '/api/content/notices'
    }
  }));
};
