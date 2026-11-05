'use strict';

const { setCorsHeaders } = require('./_cors');

module.exports = (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kavya Shree Institute of Nursing API',
    database: 'connected',
    version: '1.0.0'
  }));
};
