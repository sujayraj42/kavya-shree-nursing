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
    enquiries: [],
    applications: [],
    content: []
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
      memoryData.applications = Array.isArray(memoryData.applications) ? memoryData.applications : [];
      memoryData.content = Array.isArray(memoryData.content) ? memoryData.content : [];

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

function filterRecords(records, query) {
  return records.filter(e => {
    if (query.deletedAt === null && e.deletedAt) return false;
    if (query.status && e.status !== query.status) return false;
    if (query.program && e.program !== query.program) return false;
    if (query.createdAt) {
      const recordDate = new Date(e.createdAt).getTime();
      if (query.createdAt.$gte && recordDate < new Date(query.createdAt.$gte).getTime()) return false;
      if (query.createdAt.$lte && recordDate > new Date(query.createdAt.$lte).getTime()) return false;
    }
    if (query.$or) {
      const match = query.$or.some(condition => {
        if (condition.name && condition.name.test(e.name)) return true;
        if (condition.applicantName && condition.applicantName.test(e.applicantName)) return true;
        if (condition.applicationNumber && condition.applicationNumber.test(e.applicationNumber)) return true;
        if (condition.phone && condition.phone.test(e.phone)) return true;
        if (condition.email && e.email && condition.email.test(e.email)) return true;
        return false;
      });
      if (!match) return false;
    }
    return true;
  });
}

function filterEnquiries(query) {
  const data = loadData();
  return filterRecords(data.enquiries, query);
}

function filterApplications(query) {
  const data = loadData();
  return filterRecords(data.applications, query);
}

/**
 * Activates local development storage hooks on Mongoose models.
 * Called automatically when local MongoDB is not running in development.
 */
function activateDevStorage(AdminModel, EnquiryModel, ApplicationModel, ContentItemModel) {
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
      isActive: found.isActive !== false,
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
        if (this.password && typeof this.password === 'string' && !this.password.startsWith('$2')) {
          found.passwords.unshift(bcrypt.hashSync(this.password, 10));
        }
        found.lastLoginAt = this.lastLoginAt || found.lastLoginAt;
        saveData();
        return this;
      }
    };
  };

  AdminModel.findById = function (id) {
    const data = loadData();
    const found = data.admins.find(a => a._id === id || a.id === id);

    const doc = found
      ? {
          _id: found._id,
          id: found.id,
          email: found.email,
          name: found.name,
          role: found.role,
          isActive: found.isActive !== false,
          comparePassword: async function (candidate) {
            for (const hash of found.passwords) {
              if (await bcrypt.compare(candidate, hash)) return true;
            }
            return false;
          },
          save: async function () {
            if (this.password && typeof this.password === 'string' && !this.password.startsWith('$2')) {
              found.passwords.unshift(bcrypt.hashSync(this.password, 10));
            }
            saveData();
            return this;
          }
        }
      : null;

    return {
      select: async function () {
        return doc;
      },
      then: async function (resolve) {
        return resolve(doc);
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
      isActive: adminData.isActive !== false,
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
      deletedAt: null,
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

  EnquiryModel.findOne = async function (query = {}) {
    const data = loadData();
    const item = data.enquiries.find(e => {
      if (query._id && e._id !== query._id && e.id !== query._id) return false;
      if (query.deletedAt === null && e.deletedAt) return false;
      return true;
    });
    if (!item) return null;

    return {
      ...item,
      save: async function () {
        item.status = this.status;
        item.deletedAt = this.deletedAt;
        item.notes = this.notes || item.notes;
        item.updatedAt = new Date().toISOString();
        saveData();
        return this;
      }
    };
  };

  EnquiryModel.findById = async function (id) {
    return EnquiryModel.findOne({ _id: id });
  };

  EnquiryModel.aggregate = async function (pipeline) {
    const data = loadData();
    const counts = {};
    for (const e of data.enquiries) {
      if (e.deletedAt) continue;
      counts[e.status] = (counts[e.status] || 0) + 1;
    }
    return Object.keys(counts).map(status => ({
      _id: status,
      count: counts[status]
    }));
  };

  // 3. Application Model Hooks (if provided)
  if (ApplicationModel) {
    ApplicationModel.create = async function (appData) {
      const data = loadData();
      const newId = new mongoose.Types.ObjectId().toString();
      const now = new Date().toISOString();

      const created = {
        _id: newId,
        id: newId,
        applicationNumber: appData.applicationNumber,
        applicantName: appData.applicantName,
        gender: appData.gender,
        dob: appData.dob,
        fatherName: appData.fatherName,
        motherName: appData.motherName,
        phone: appData.phone,
        email: appData.email,
        category: appData.category || 'General',
        address: appData.address || {},
        program: appData.program,
        academicDetails: appData.academicDetails || {},
        documents: appData.documents || {},
        declaration: true,
        status: appData.status || 'submitted',
        notes: [],
        deletedAt: null,
        createdAt: now,
        updatedAt: now
      };

      data.applications.unshift(created);
      saveData();
      return created;
    };

    ApplicationModel.countDocuments = async function (query = {}) {
      return filterApplications(query).length;
    };

    ApplicationModel.find = function (query = {}) {
      let filtered = filterApplications(query);
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

    ApplicationModel.findOne = async function (query = {}) {
      const data = loadData();
      const item = data.applications.find(a => {
        if (query._id && a._id !== query._id && a.id !== query._id) return false;
        if (query.deletedAt === null && a.deletedAt) return false;
        return true;
      });
      if (!item) return null;

      return {
        ...item,
        save: async function () {
          item.status = this.status;
          item.deletedAt = this.deletedAt;
          item.notes = this.notes || item.notes;
          item.updatedAt = new Date().toISOString();
          saveData();
          return this;
        }
      };
    };
  }

  // 4. ContentItem Model Hooks
  if (ContentItemModel) {
    ContentItemModel.find = function (query = {}) {
      const data = loadData();
      let filtered = (data.content || []).filter(c => {
        if (query.section && c.section !== query.section) return false;
        if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
        return true;
      });
      return {
        sort: function () {
          return Promise.resolve(filtered);
        },
        then: function (resolve) {
          resolve(filtered);
        }
      };
    };
  }
}

module.exports = {
  activateDevStorage,
  loadData,
  saveData
};
