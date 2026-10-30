'use strict';

const mongoose = require('mongoose');
const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/database');
const { loadData } = require('../backend/src/config/devStorage');
const { Admin } = require('../backend/src/models/Admin');
const { Enquiry } = require('../backend/src/models/Enquiry');

let dbInitialized = false;

async function ensureMongoSchemaAndSeed() {
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

    const defaultPassword = process.env.ADMIN_SEED_PASSWORD || 'qwertyuiop123';
    const defaultAdmins = [
      {
        email: (process.env.ADMIN_SEED_EMAIL || 'admin@edu.in').trim().toLowerCase(),
        password: defaultPassword,
        name: (process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim(),
        role: 'superadmin'
      },
      {
        email: 'admin@kavyashreenursing.edu.in',
        password: defaultPassword,
        name: 'Dr. System Administrator',
        role: 'superadmin'
      }
    ];

    for (const adm of defaultAdmins) {
      const exists = await Admin.findOne({ email: adm.email });
      if (!exists) {
        await Admin.create(adm);
      }
    }

    const enquiryCount = await Enquiry.countDocuments();
    if (enquiryCount === 0) {
      const seedDataset = loadData();
      const initialEnquiries = seedDataset.enquiries || [];
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
    }
  } catch (err) {
    console.warn('[WARN] Auto-provisioning check skipped:', err.message);
  }
}

module.exports = async function handler(req, res) {
  if (!dbInitialized) {
    await connectDB({ allowDevStore: true });
    await ensureMongoSchemaAndSeed();
    dbInitialized = true;
  }
  return app(req, res);
};
