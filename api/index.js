'use strict';

/**
 * Vercel Serverless Function Fallback
 * Seamlessly forwards API traffic to the live Render backend instance.
 */
module.exports = (req, res) => {
  const targetPath = req.url || '/api/health';
  const targetUrl = `https://kavya-shree-nursing.onrender.com${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;

  res.writeHead(307, {
    'Location': targetUrl,
    'Access-Control-Allow-Origin': '*'
  });
  res.end();
};
