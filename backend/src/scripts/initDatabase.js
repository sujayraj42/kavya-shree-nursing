'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB, getDatabaseStatus } = require('../config/database');
const { Admin } = require('../models/Admin');
const { Enquiry } = require('../models/Enquiry');

/**
 * Idempotent MongoDB Database Initialization Script.
 * - Connects to MongoDB Atlas (when MONGODB_URI is set) or local embedded store
 * - Creates 'admins' and 'enquiries' collections and builds all schema indexes
 * - Seeds initial administrator account only if ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are set
 */
async function initDatabase() {
  console.log('[INFO] Starting database initialization for Kavya Shree Institute of Nursing...');
  await connectDB({ allowDevStore: true });

  const status = getDatabaseStatus();
  console.log(`[INFO] Database connection status: ${status}`);

  // If connected to a live MongoDB instance, synchronize schema indexes
  if (mongoose.connection.readyState === 1) {
    console.log(`[INFO] Connected to MongoDB database: ${mongoose.connection.name}`);
    await Admin.createCollection().catch(() => {});
    await Enquiry.createCollection().catch(() => {});

    await Admin.syncIndexes();
    await Enquiry.syncIndexes();
    console.log('[INFO] MongoDB collections (admins, enquiries) and indexes verified.');
  }

  // Provision initial administrator only when explicit seed credentials are provided via env
  const seedEmail = (process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || '';
  const seedName = (process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim();

  if (seedEmail && seedPassword.length >= 8) {
    const existingAdmin = await Admin.findOne({ email: seedEmail });
    if (!existingAdmin) {
      await Admin.create({
        email: seedEmail,
        password: seedPassword,
        name: seedName,
        role: 'superadmin'
      });
      console.log(`[SUCCESS] Provisioned superadmin account: ${seedEmail}`);
    } else {
      console.log(`[INFO] Superadmin account already exists: ${seedEmail}`);
    }
  } else {
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
