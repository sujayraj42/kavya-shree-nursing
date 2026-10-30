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

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: config.isProduction ? 10000 : 2000
    });
    isConnected = true;
    console.log('[INFO] Database connection established successfully');
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error.message);

    const canUseDevStore = !config.isProduction && allowDevStore && !config.mongodbUriConfigured;

    if (!canUseDevStore) {
      if (config.isProduction) {
        console.error('[FATAL] Cannot operate in production without a working database connection');
        process.exit(1);
      }
      throw error;
    }

    console.log('[INFO] MongoDB instance not reachable. Enabling Local Development Data Store (development only)...');
    const { activateDevStorage } = require('./devStorage');
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    activateDevStorage(Admin, Enquiry);
    isDevStorageActive = true;
    isConnected = true;
    console.log('[INFO] Local Development Data Store active (data file: backend/data/dev-database.json).');
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
