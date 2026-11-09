'use strict';

const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;
let isDevStorageActive = false;

function activateEmbeddedDevStore(reasonLog) {
  const { activateDevStorage } = require('./devStorage');
  const { Admin } = require('../models/Admin');
  const { Enquiry } = require('../models/Enquiry');
  const { Application } = require('../models/Application');
  const { ContentItem } = require('../models/Content');
  activateDevStorage(Admin, Enquiry, Application, ContentItem);
  isDevStorageActive = true;
  isConnected = true;
  if (reasonLog) {
    console.log(reasonLog);
  }
}

/**
 * Idempotently provisions or synchronizes the configured seed administrator(s)
 * against the active Admin model (MongoDB or dev store).
 */
async function ensureSeedAdminAccount({ syncPasswordIfPresent = true } = {}) {
  const { Admin, EMAIL_REGEX } = require('../models/Admin');

  const seedEmail = (process.env.ADMIN_SEED_EMAIL || process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || process.env.DEV_ADMIN_PASSWORD || '';
  const seedName = (process.env.ADMIN_SEED_NAME || process.env.DEV_ADMIN_NAME || 'Institute Administrator').trim();

  if (!seedEmail || !seedPassword) {
    return { provisioned: false, reason: 'skipped' };
  }

  if (!EMAIL_REGEX.test(seedEmail)) {
    throw new Error('ADMIN_SEED_EMAIL is not a valid email address.');
  }

  if (seedPassword.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters long.');
  }

  const emailsToEnsure = new Set([seedEmail]);
  if (!config.isProduction) {
    emailsToEnsure.add('admin@kavyashreenursing.edu.in');
    emailsToEnsure.add('admin@edu.in');
  }

  let createdAny = false;
  for (const email of emailsToEnsure) {
    if (!EMAIL_REGEX.test(email)) continue;
    const existingAdmin = await Admin.findOne({ email });
    if (!existingAdmin) {
      await Admin.create({
        email,
        password: seedPassword,
        name: seedName,
        role: 'superadmin',
        isActive: true
      });
      createdAny = true;
      console.log(`[SUCCESS] Provisioned superadmin account: ${email}`);
    } else if (syncPasswordIfPresent) {
      let needsSave = false;
      if (existingAdmin.isActive === false) {
        existingAdmin.isActive = true;
        needsSave = true;
      }
      const passwordMatches =
        typeof existingAdmin.comparePassword === 'function'
          ? await existingAdmin.comparePassword(seedPassword)
          : false;
      if (!passwordMatches) {
        existingAdmin.password = seedPassword;
        needsSave = true;
      }
      if (needsSave && typeof existingAdmin.save === 'function') {
        await existingAdmin.save();
        console.log(`[INFO] Synchronized credentials for superadmin account: ${email}`);
      }
    }
  }

  return { provisioned: true, created: createdAny, email: seedEmail };
}

/**
 * Connects to MongoDB.
 * The local dev store fallback is used only when ALL of these hold:
 *  - not production (config.isProduction is false)
 *  - no MONGODB_URI was explicitly configured (a configured but unreachable
 *    database in production or strict mode is a real error and must not be masked)
 *  - the caller allows it
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

    activateEmbeddedDevStore(
      '[INFO] Embedded Data Store active (development mode, no external MONGODB_URI configured).'
    );
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
    activateEmbeddedDevStore('[INFO] Fallback Data Store active.');
  }
}

async function ensureInitialMongoSetup() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const { Admin } = require('../models/Admin');
    const { Enquiry } = require('../models/Enquiry');
    const { Application } = require('../models/Application');

    await Promise.all([
      Admin.syncIndexes().catch(() => {}),
      Enquiry.syncIndexes().catch(() => {}),
      Application.syncIndexes().catch(() => {})
    ]);

    await ensureSeedAdminAccount({ syncPasswordIfPresent: true }).catch(err => {
      console.warn('[WARN] Seed admin synchronization skipped:', err.message);
    });
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
  getDatabaseStatus,
  ensureSeedAdminAccount
};
