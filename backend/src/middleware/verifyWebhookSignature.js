'use strict';

const crypto = require('crypto');

/**
 * Express middleware to verify HMAC-SHA256 signatures on inbound webhooks.
 * Prevents unauthorized or spoofed webhook callbacks using crypto.timingSafeEqual.
 */
function verifyWebhookSignature(secretEnvKey = 'WEBHOOK_SECRET') {
  return (req, res, next) => {
    const secret = process.env[secretEnvKey];
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'Webhook verification secret is not configured on the server.'
      });
    }

    const signature =
      req.headers['x-signature-256'] ||
      req.headers['x-hub-signature-256'] ||
      '';

    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature header (x-signature-256).'
      });
    }

    const rawPayload =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : JSON.stringify(req.body || {});

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex')}`;

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(signature, 'utf8');

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature.'
      });
    }

    next();
  };
}

module.exports = {
  verifyWebhookSignature
};

