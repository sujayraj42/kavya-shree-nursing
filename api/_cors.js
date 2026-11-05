'use strict';

const ALLOWED_PROJECT_ORIGIN_REGEX = /^https:\/\/kavya-shree-nursing(-[a-z0-9-]+)?\.vercel\.app$/i;
const LOCALHOST_REGEX = /^http:\/\/localhost(:\d+)?$/;

/**
 * Restricts CORS to authorized institutional domain, project Vercel deployments, and localhost.
 * Prevents wildcard origin exposure (*).
 */
function setCorsHeaders(req, res) {
  const origin = (req.headers && req.headers.origin) ? String(req.headers.origin).trim() : '';

  if (origin) {
    if (
      origin === 'https://kavya-shree-nursing.vercel.app' ||
      ALLOWED_PROJECT_ORIGIN_REGEX.test(origin) ||
      LOCALHOST_REGEX.test(origin)
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // Direct server-to-server or same-origin default
    res.setHeader('Access-Control-Allow-Origin', 'https://kavya-shree-nursing.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = {
  setCorsHeaders
};

