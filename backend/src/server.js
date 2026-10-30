'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

async function startServer() {
  // Connect to MongoDB Atlas
  await connectDB();

  // Listen on configured PORT and 0.0.0.0
  const server = app.listen(config.port, config.host, () => {
    console.log(
      `[INFO] Kavya Shree Institute Backend running in ${config.env} mode on http://${config.host}:${config.port}`
    );
  });

  server.on('error', async err => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[FATAL] Port ${config.port} is already in use. Another backend instance is probably running. Stop it or set a different PORT.`
      );
    } else {
      console.error('[FATAL] HTTP server error:', err.message);
    }
    await disconnectDB().catch(() => {});
    process.exit(1);
  });

  // Graceful shutdown handling
  async function shutdown(signal) {
    console.log(`[INFO] Received ${signal}. Initiating graceful shutdown...`);
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

module.exports = { startServer };
