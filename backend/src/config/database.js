'use strict';

const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;
let isDevStorageActive = false;

/**
 * Connects to MongoDB.
 * The local dev store fallback is used only when ALL of these hold:
 *  - not production (config.isProduction is false)
 *  - no MONGODB_URI was explicitly configured (a configured but unreachable
 *    database in production or strict mode is a real error and must not be masked)
 *  - the caller allows it (the admin seed script must target a real database)
 */
async function connectDB({ allowDevStore = true } = {}) {
  if (isConnected || mongoose.connection.readyState === 1 || isDevStorageActive) {
    return;
  }

  const canUseDevStore = allowDevStore && !config.isProduction;

  if (!config.mongodbUriConfigured) {
    if (!canUseDevStore) {
      const err = new Error('Missing MONGODB_URI configuration for database connection.');
      console.error('[FATAL] Cannot operate without a configured database URI:', err.message);
      if (config.strictProductionConfig) {
        process.exit(1);
      }
      throw err;
    }

    const { activateDevStorage } = require('./devStorage');
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    const { Application } = require('../models/Application');
    const { ContentItem } = require('../models/Content');
    activateDevStorage(Admin, Enquiry, Application, ContentItem);
    isDevStorageActive = true;
    isConnected = true;
    console.log('[INFO] Embedded Data Store active (development mode, no external MONGODB_URI configured).');
    return;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      dbName: config.mongodbDbName,
      serverSelectionTimeoutMS: config.isProduction ? 15000 : 2000
    });
    isConnected = true;
    console.log('[INFO] Database connection established successfully');
    await ensureInitialMongoSetup();
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error.message);

    if (!canUseDevStore) {
      if (config.strictProductionConfig) {
        console.error('[FATAL] Cannot operate in production without a working database connection');
        process.exit(1);
      }
      throw error;
    }

    console.log('[INFO] MongoDB instance not reachable in development. Enabling Fallback Data Store...');
    const { activateDevStorage } = require('./devStorage');
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    const { Application } = require('../models/Application');
    const { ContentItem } = require('../models/Content');
    activateDevStorage(Admin, Enquiry, Application, ContentItem);
    isDevStorageActive = true;
    isConnected = true;
    console.log('[INFO] Fallback Data Store active.');
  }
}

async function ensureInitialMongoSetup() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');

    await Promise.all([
      Admin.syncIndexes().catch(() => {}),
      Enquiry.syncIndexes().catch(() => {})
    ]);
  } catch (err) {
    console.warn('[WARN] Initial MongoDB index verification skipped:', err.message);
  }
}

async function disconnectDB() {
  if (isDevStorageActive) {
    isDevStorageActive = false;
    isConnected = false;
    return;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

function getDatabaseStatus() {
  if (isDevStorageActive) {
    return 'connected (local-dev-store)';
  }
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus
};
