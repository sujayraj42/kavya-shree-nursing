'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
const { connectDB, disconnectDB } = require('../config/database');
const { Admin } = require('../models/Admin');

/**
 * Idempotent Administrative Account Provisioning Script.
 * Requires ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD environment variables.
 * Safe to run multiple times; creates the initial superadmin account only if absent.
 * NEVER logs passwords, JWTs, or secrets.
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || '';
  const name = (process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim();

  if (!email || !password) {
    console.error(
      '[ERROR] Admin provisioning aborted: Both ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be configured in environment.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('[ERROR] Admin provisioning aborted: ADMIN_SEED_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`[INFO] Administrator account already exists for ${email}. No modification made.`);
      await disconnectDB();
      return;
    }

    await Admin.create({
      email,
      password,
      name,
      role: 'superadmin'
    });

    console.log(`[SUCCESS] Initial administrator account created successfully for: ${email}`);
    await disconnectDB();
  } catch (error) {
    console.error('[ERROR] Administrator provisioning failed:', error.message);
    try {
      await disconnectDB();
    } catch {
      // Ignore disconnect error on failure
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedAdmin;
