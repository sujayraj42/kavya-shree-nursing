'use strict';

const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;
let isDevStorageActive = false;

/**
 * Connects to MongoDB.
 * The local dev store fallback is used only when ALL of these hold:
 *  - not production
 *  - no MONGODB_URI was explicitly configured (a configured but unreachable
 *    database is a real error and must not be masked by sample data)
 *  - the caller allows it (the admin seed script must target a real database)
 */
async function connectDB({ allowDevStore = true } = {}) {
  if (isConnected || mongoose.connection.readyState === 1 || isDevStorageActive) {
    return;
  }

  const strictProd = config.isProduction && process.env.STRICT_PRODUCTION_CONFIG === 'true';

  if (!config.mongodbUriConfigured && allowDevStore && !strictProd) {
    const { activateDevStorage } = require('./devStorage');
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    activateDevStorage(Admin, Enquiry);
    isDevStorageActive = true;
    isConnected = true;
    console.log('[INFO] Embedded Data Store active (no external MONGODB_URI configured).');
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

    const canUseDevStore = allowDevStore && !strictProd;

    if (!canUseDevStore) {
      if (strictProd) {
        console.error('[FATAL] Cannot operate in strict production without a working database connection');
        process.exit(1);
      }
      throw error;
    }

    console.log('[INFO] MongoDB instance not reachable. Enabling Fallback Data Store...');
    const { activateDevStorage } = require('./devStorage');
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    activateDevStorage(Admin, Enquiry);
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

    // Clean up any legacy sample/dummy enquiries that were previously seeded
    await Enquiry.deleteMany({
      $or: [
        { email: /@example\.com$/i },
        {
          name: 'Sneha Patel',
          phone: '9876543214',
          message: 'Interested in pediatric and community nursing specializations.'
        }
      ]
    }).catch(() => {});
  } catch (err) {
    console.warn('[WARN] Initial MongoDB setup check skipped:', err.message);
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
