'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDB, disconnectDB, getDatabaseStatus } = require('../config/database');
const { loadData } = require('../config/devStorage');
const { Admin } = require('../models/Admin');
const { Enquiry } = require('../models/Enquiry');

/**
 * Idempotent MongoDB Database Initialization & Seeding Script.
 * - Connects to MongoDB Atlas (when MONGODB_URI is set) or local embedded store
 * - Creates 'admins' and 'enquiries' collections and builds all schema indexes
 * - Seeds initial administrator account if absent
 * - Seeds sample/existing enquiries if collection is empty
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

  // Ensure initial administrator exists
  const seedEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@kavyashreenursing.edu.in').trim().toLowerCase();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || 'qwertyuiop123';
  const seedName = (process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim();

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

  // Ensure initial enquiries exist
  const enquiryCount = await Enquiry.countDocuments();
  if (enquiryCount === 0) {
    const devData = loadData();
    const initialEnquiries = devData.enquiries || [];
    for (const item of initialEnquiries) {
      await Enquiry.create({
        name: item.name,
        phone: item.phone,
        email: item.email,
        program: item.program,
        message: item.message,
        consent: true,
        status: item.status || 'new'
      });
    }
    console.log(`[SUCCESS] Seeded ${initialEnquiries.length} initial enquiries.`);
  } else {
    console.log(`[INFO] Enquiries collection already contains ${enquiryCount} records.`);
  }

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
