'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

let keepAliveTimer = null;

/**
 * Periodically pings the external Render health endpoint every 10 minutes
 * so the free-tier Render instance does not spin down after 15 minutes of inactivity.
 */
function startKeepAlivePing() {
  if (!config.keepAliveEnabled || !config.keepAliveUrl) {
    return null;
  }

  const targetUrl = `${config.keepAliveUrl}/api/health`;
  const intervalMs = config.keepAliveIntervalMs;

  console.log(
    `[INFO] Render keep-alive ping enabled: pinging ${targetUrl} every ${Math.round(intervalMs / 60000)} minutes.`
  );

  const timer = setInterval(async () => {
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'KavyaShree-Render-KeepAlive/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        console.warn(`[WARN] Keep-alive ping returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn(`[WARN] Keep-alive ping failed: ${err.message}`);
    }
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}

function stopKeepAlivePing() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

async function startServer() {
  // Connect to MongoDB Atlas
  await connectDB();

  // Listen on configured PORT and 0.0.0.0
  const server = app.listen(config.port, config.host, () => {
    console.log(
      `[INFO] Kavya Shree Institute Backend running in ${config.env} mode on http://${config.host}:${config.port}`
    );
    keepAliveTimer = startKeepAlivePing();
  });

  server.on('error', async err => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[FATAL] Port ${config.port} is already in use. Another backend instance is probably running. Stop it or set a different PORT.`
      );
    } else {
      console.error('[FATAL] HTTP server error:', err.message);
    }
    stopKeepAlivePing();
    await disconnectDB().catch(() => {});
    process.exit(1);
  });

  // Graceful shutdown handling
  async function shutdown(signal) {
    console.log(`[INFO] Received ${signal}. Initiating graceful shutdown...`);
    stopKeepAlivePing();
    server.close(async () => {
      console.log('[INFO] HTTP server closed.');
      await disconnectDB();
      console.log('[INFO] Database disconnected. Process terminating gracefully.');
      process.exit(0);
    });

    // Force close if graceful shutdown hangs
    setTimeout(() => {
      console.error('[ERROR] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', err => {
    console.error('[FATAL] Uncaught Exception:', err);
    shutdown('uncaughtException');
  });

  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('[FATAL] Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = { startServer, startKeepAlivePing, stopKeepAlivePing };
