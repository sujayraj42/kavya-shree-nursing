'use strict';

const mongoose = require('mongoose');
const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/database');
const { Admin } = require('../backend/src/models/Admin');
const { Enquiry } = require('../backend/src/models/Enquiry');

let dbInitialized = false;

async function ensureMongoSchemaAndAdmin() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    await Promise.all([
      Admin.createCollection().catch(() => {}),
      Enquiry.createCollection().catch(() => {})
    ]);
    await Promise.all([
      Admin.syncIndexes().catch(() => {}),
      Enquiry.syncIndexes().catch(() => {})
    ]);

    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = (process.env.ADMIN_SEED_EMAIL || 'admin@edu.in').trim().toLowerCase();
      const password = process.env.ADMIN_SEED_PASSWORD || 'qwertyuiop123';
      const name = (process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim();
      await Admin.create({ email, password, name, role: 'superadmin' });
    }
  } catch (err) {
    console.warn('[WARN] Auto-provisioning check skipped:', err.message);
  }
}

module.exports = async function handler(req, res) {
  if (!dbInitialized) {
    await connectDB({ allowDevStore: true });
    await ensureMongoSchemaAndAdmin();
    dbInitialized = true;
  }
  return app(req, res);
};
