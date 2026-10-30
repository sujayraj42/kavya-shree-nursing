'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'dev-database.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'kavya-shree-dev-database.json');

// Builds development administrators from environment variables only (no hardcoded demo credentials).
function getDevAdmins() {
  const admins = [];

  const envEmail = (process.env.DEV_ADMIN_EMAIL || process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const envPassword = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || '';
  if (envEmail && envPassword.length >= 8) {
    const id = new mongoose.Types.ObjectId().toString();
    admins.push({
      _id: id,
      id,
      email: envEmail,
      name: (process.env.DEV_ADMIN_NAME || process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim(),
      role: 'superadmin',
      passwords: [bcrypt.hashSync(envPassword, 10)],
      lastLoginAt: null
    });
  }
  return admins;
}

// Default initial dataset for local development (clean empty state without dummy records)
function getDefaultDataset() {
  return {
    admins: getDevAdmins(),
    enquiries: []
  };
}

let memoryData = null;

function loadData() {
  if (memoryData) return memoryData;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      memoryData = JSON.parse(raw);
      memoryData.admins = Array.isArray(memoryData.admins) ? memoryData.admins : [];
      memoryData.enquiries = Array.isArray(memoryData.enquiries) ? memoryData.enquiries : [];

      // Add an env-configured dev admin to an existing data file if not already present.
      const envEmail = (process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
      if (envEmail && !memoryData.admins.some(a => a.email.toLowerCase() === envEmail)) {
        memoryData.admins.push(...getDevAdmins());
        saveData();
      }
      return memoryData;
    }
  } catch (err) {
    console.warn('[WARN] Could not read existing dev-database.json, initializing fresh dataset.');
  }

  memoryData = getDefaultDataset();
  saveData();
  return memoryData;
}

function saveData() {
  if (!memoryData) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
  } catch {
    try {
      fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
    } catch {
      // Keep in-memory state if filesystem is read-only
    }
  }
}

function filterEnquiries(query) {
  const data = loadData();
  return data.enquiries.filter(e => {
    if (query.status && e.status !== query.status) return false;
    if (query.program && e.program !== query.program) return false;
    if (query.$or) {
      const match = query.$or.some(condition => {
        if (condition.name && condition.name.test(e.name)) return true;
        if (condition.phone && condition.phone.test(e.phone)) return true;
        if (condition.email && e.email && condition.email.test(e.email)) return true;
        return false;
      });
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Activates local development storage hooks on Mongoose models.
 * Called automatically when local MongoDB is not running in development.
 */
function activateDevStorage(AdminModel, EnquiryModel) {
  loadData();

  // 1. Admin Model Hooks
  AdminModel.findOne = async function (q) {
    const data = loadData();
    const queryEmail = (q.email || '').trim().toLowerCase();
    const found = data.admins.find(a => a.email.toLowerCase() === queryEmail);

    if (!found) return null;

    return {
      _id: found._id,
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      lastLoginAt: found.lastLoginAt,
      comparePassword: async function (candidate) {
        for (const hash of found.passwords) {
          if (await bcrypt.compare(candidate, hash)) {
            return true;
          }
        }
        return false;
      },
      save: async function () {
        found.lastLoginAt = new Date().toISOString();
        saveData();
        return this;
      }
    };
  };

  AdminModel.findById = function (id) {
    const data = loadData();
    const found = data.admins.find(a => a._id === id || a.id === id);

    return {
      select: async function () {
        if (!found) return null;
        return {
          _id: found._id,
          id: found.id,
          email: found.email,
          name: found.name,
          role: found.role
        };
      },
      then: async function (resolve) {
        if (!found) return resolve(null);
        return resolve({
          _id: found._id,
          id: found.id,
          email: found.email,
          name: found.name,
          role: found.role
        });
      }
    };
  };

  AdminModel.create = async function (adminData) {
    const data = loadData();
    const id = new mongoose.Types.ObjectId().toString();
    const hash = bcrypt.hashSync(adminData.password, 10);
    const created = {
      _id: id,
      id,
      email: (adminData.email || '').trim().toLowerCase(),
      name: (adminData.name || 'Institute Administrator').trim(),
      role: adminData.role || 'admin',
      passwords: [hash],
      lastLoginAt: null
    };
    data.admins.push(created);
    saveData();
    return created;
  };

  // 2. Enquiry Model Hooks
  EnquiryModel.create = async function (enquiryData) {
    const data = loadData();
    const newId = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();

    const newEnquiry = {
      _id: newId,
      id: newId,
      name: enquiryData.name,
      phone: enquiryData.phone,
      email: enquiryData.email || null,
      program: enquiryData.program,
      message: enquiryData.message || '',
      consent: Boolean(enquiryData.consent),
      status: enquiryData.status || 'new',
      notes: [],
      createdAt: now,
      updatedAt: now
    };

    data.enquiries.unshift(newEnquiry);
    saveData();
    return newEnquiry;
  };

  EnquiryModel.countDocuments = async function (query = {}) {
    return filterEnquiries(query).length;
  };

  EnquiryModel.find = function (query = {}) {
    let filtered = filterEnquiries(query);
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      sort: function () {
        return this;
      },
      skip: function (n) {
        filtered = filtered.slice(n);
        return this;
      },
      limit: function (n) {
        filtered = filtered.slice(0, n);
        return Promise.resolve(filtered);
      },
      then: function (resolve) {
        resolve(filtered);
      }
    };
  };

  EnquiryModel.findById = async function (id) {
    const data = loadData();
    const item = data.enquiries.find(e => e.id === id || e._id === id);
    if (!item) return null;

    const notesList = (item.notes || []).map(n => ({
      id: n.id || n._id || new mongoose.Types.ObjectId().toString(),
      _id: n._id || n.id || new mongoose.Types.ObjectId().toString(),
      author: n.author,
      text: n.text,
      createdAt: n.createdAt || new Date().toISOString()
    }));

    return {
      ...item,
      notes: notesList,
      save: async function () {
        item.status = this.status;
        item.notes = this.notes.map(n => ({
          id: n.id || n._id || new mongoose.Types.ObjectId().toString(),
          _id: n._id || n.id || new mongoose.Types.ObjectId().toString(),
          author: n.author,
          text: n.text,
          createdAt: n.createdAt || new Date().toISOString()
        }));
        this.notes = item.notes;
        item.updatedAt = new Date().toISOString();
        this.updatedAt = item.updatedAt;
        saveData();
        return this;
      }
    };
  };

  EnquiryModel.aggregate = async function (pipeline) {
    const data = loadData();
    const counts = {};
    for (const e of data.enquiries) {
      counts[e.status] = (counts[e.status] || 0) + 1;
    }
    return Object.keys(counts).map(status => ({
      _id: status,
      count: counts[status]
    }));
  };
}

module.exports = {
  activateDevStorage,
  loadData,
  saveData
};
