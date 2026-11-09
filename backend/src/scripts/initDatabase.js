'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDB, disconnectDB, getDatabaseStatus, ensureSeedAdminAccount } = require('../config/database');
const { Admin } = require('../models/Admin');
const { Enquiry } = require('../models/Enquiry');
const { Application } = require('../models/Application');

/**
 * Idempotent MongoDB Database Initialization Script.
 * - Connects to MongoDB Atlas (when MONGODB_URI is set) or local embedded store (development only)
 * - Creates 'admins', 'enquiries', and 'applications' collections and builds all schema indexes
 * - Seeds/synchronizes initial administrator account when ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are set
 */
async function initDatabase() {
  console.log('[INFO] Starting database initialization for Kavya Shree Institute of Nursing...');
  await connectDB({ allowDevStore: !config.mongodbUriConfigured && !config.isProduction });

  const status = getDatabaseStatus();
  console.log(`[INFO] Database connection status: ${status}`);

  if (mongoose.connection.readyState === 1) {
    console.log(`[INFO] Connected to MongoDB database: ${mongoose.connection.name}`);
    await Promise.all([
      Admin.createCollection().catch(() => {}),
      Enquiry.createCollection().catch(() => {}),
      Application.createCollection().catch(() => {})
    ]);

    await Promise.all([
      Admin.syncIndexes(),
      Enquiry.syncIndexes(),
      Application.syncIndexes()
    ]);
    console.log('[INFO] MongoDB collections (admins, enquiries, applications) and indexes verified.');
  }

  const seedResult = await ensureSeedAdminAccount({ syncPasswordIfPresent: true });
  if (!seedResult.provisioned) {
    console.log('[INFO] Skipping admin seeding (set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to provision an admin).');
  }

  const enquiryCount = await Enquiry.countDocuments();
  console.log(`[INFO] Enquiries collection currently contains ${enquiryCount} records.`);

  await disconnectDB();
  console.log('[SUCCESS] Database setup completed successfully.');
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[ERROR] Database initialization failed:', err.message);
      process.exit(1);
    });
}

module.exports = initDatabase;
