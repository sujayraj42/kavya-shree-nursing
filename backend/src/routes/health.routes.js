'use strict';

const express = require('express');
const config = require('../config/env');
const db = require('../config/database');

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = db.getDatabaseStatus();
  const isHealthy = config.isProduction
    ? dbStatus === 'connected'
    : typeof dbStatus === 'string' && dbStatus.startsWith('connected');
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus
  });
});

module.exports = router;
