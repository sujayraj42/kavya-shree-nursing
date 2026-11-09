'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'dev-database.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'kavya-shree-dev-database.json');

const DEFAULT_DEV_EMAILS = ['admin@kavyashreenursing.edu.in', 'admin@edu.in'];
const DEFAULT_DEV_PASSWORD = 'qwertyuiop123';

function getEffectiveDevPassword() {
  const envPass = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || '';
  if (envPass && envPass.length >= 8) {
    return envPass;
  }
  return process.env.NODE_ENV !== 'production' ? DEFAULT_DEV_PASSWORD : '';
}

function getTargetDevEmails() {
  const emails = new Set(DEFAULT_DEV_EMAILS);
  const devEmail = (process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
  const seedEmail = (process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  if (devEmail) emails.add(devEmail);
  if (seedEmail) emails.add(seedEmail);
  return Array.from(emails);
}

/**
 * Synchronizes development administrators so configured/default credentials always work in local dev.
 */
function syncDevAdmins(adminsList) {
  const admins = Array.isArray(adminsList) ? adminsList : [];
  const password = getEffectiveDevPassword();
  if (!password || password.length < 8) {
    return { admins, modified: false };
  }

  const targetEmails = getTargetDevEmails();
  const defaultName = (process.env.DEV_ADMIN_NAME || process.env.ADMIN_SEED_NAME || 'Institute Administrator').trim();
  let modified = false;

  for (const email of targetEmails) {
    const existing = admins.find(a => a && typeof a.email === 'string' && a.email.toLowerCase() === email);
    if (!existing) {
      const id = new mongoose.Types.ObjectId().toString();
      admins.push({
        _id: id,
        id,
        email,
        name: email === 'admin@edu.in' ? 'Kavya Shree Super Admin' : defaultName,
        role: 'superadmin',
        isActive: true,
        passwords: [bcrypt.hashSync(password, 10)],
        lastLoginAt: null
      });
      modified = true;
    } else {
      if (!Array.isArray(existing.passwords)) {
        existing.passwords = [];
        modified = true;
      }
      if (existing.isActive === undefined) {
        existing.isActive = true;
        modified = true;
      }
      const matchesCurrentPassword = existing.passwords.some(hash => {
        try {
          return typeof hash === 'string' && bcrypt.compareSync(password, hash);
        } catch {
          return false;
        }
      });
      if (!matchesCurrentPassword) {
        existing.passwords.unshift(bcrypt.hashSync(password, 10));
        modified = true;
      }
    }
  }

  return { admins, modified };
}

function getDevAdmins() {
  return syncDevAdmins([]).admins;
}

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

      const { modified } = syncDevAdmins(memoryData.admins);
      if (modified) {
        saveData();
      }
      return memoryData;
    }
  } catch {
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

function filterRecords(records, query = {}) {
  return records.filter(e => {
    if (query.deletedAt === null && e.deletedAt) return false;
    if (typeof query.status === 'string' && e.status !== query.status) return false;
    if (typeof query.program === 'string' && e.program !== query.program) return false;
    if (query.createdAt) {
      const recordDate = new Date(e.createdAt).getTime();
      if (query.createdAt.$gte && recordDate < new Date(query.createdAt.$gte).getTime()) return false;
      if (query.createdAt.$lte && recordDate > new Date(query.createdAt.$lte).getTime()) return false;
    }
    if (Array.isArray(query.$or)) {
      const match = query.$or.some(condition => {
        if (condition.name instanceof RegExp && condition.name.test(e.name || '')) return true;
        if (condition.applicantName instanceof RegExp && condition.applicantName.test(e.applicantName || '')) return true;
        if (condition.applicationNumber instanceof RegExp && condition.applicationNumber.test(e.applicationNumber || '')) return true;
        if (condition.phone instanceof RegExp && condition.phone.test(e.phone || '')) return true;
        if (condition.email instanceof RegExp && e.email && condition.email.test(e.email)) return true;
        return false;
      });
      if (!match) return false;
    }
    return true;
  });
}

function buildAdminDocument(found) {
  if (!found) return null;
  return {
    _id: found._id,
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    isActive: found.isActive !== false,
    lastLoginAt: found.lastLoginAt || null,
    comparePassword: async function (candidate) {
      if (!candidate || !Array.isArray(found.passwords)) return false;
      for (const hash of found.passwords) {
        if (typeof hash === 'string' && (await bcrypt.compare(candidate, hash))) {
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
      if (typeof this.isActive === 'boolean') {
        found.isActive = this.isActive;
      }
      saveData();
      return this;
    }
  };
}

function attachCollectionHooks(Model, collectionKey, createTransformFn) {
  if (!Model) return;

  Model.create = async function (payload) {
    const data = loadData();
    const newId = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();
    const created = createTransformFn(payload, newId, now);
    data[collectionKey].unshift(created);
    saveData();
    return created;
  };

  Model.countDocuments = async function (query = {}) {
    const data = loadData();
    return filterRecords(data[collectionKey], query).length;
  };

  Model.find = function (query = {}) {
    const data = loadData();
    let filtered = filterRecords(data[collectionKey], query);
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

  Model.findOne = async function (query = {}) {
    const data = loadData();
    const item = data[collectionKey].find(entry => {
      if (query._id && entry._id !== query._id && entry.id !== query._id) return false;
      if (query.applicationNumber && entry.applicationNumber !== query.applicationNumber) return false;
      if (query.deletedAt === null && entry.deletedAt) return false;
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

  Model.findById = async function (id) {
    return Model.findOne({ _id: id });
  };

  Model.aggregate = async function () {
    const data = loadData();
    const counts = {};
    for (const entry of data[collectionKey]) {
      if (entry.deletedAt) continue;
      counts[entry.status] = (counts[entry.status] || 0) + 1;
    }
    return Object.keys(counts).map(status => ({
      _id: status,
      count: counts[status]
    }));
  };
}

/**
 * Activates local development storage hooks on Mongoose models.
 * Called automatically when local MongoDB is not running in development.
 */
function activateDevStorage(AdminModel, EnquiryModel, ApplicationModel, ContentItemModel) {
  loadData();

  // 1. Admin Model Hooks
  AdminModel.findOne = async function (q = {}) {
    const data = loadData();
    const queryEmail = typeof q.email === 'string' ? q.email.trim().toLowerCase() : '';
    const found = data.admins.find(a => a && typeof a.email === 'string' && a.email.toLowerCase() === queryEmail);
    return buildAdminDocument(found);
  };

  AdminModel.findById = function (id) {
    const data = loadData();
    const found = data.admins.find(a => a && (a._id === id || a.id === id));
    const doc = buildAdminDocument(found);

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
    const rawPass = adminData.password || '';
    const hash = rawPass.startsWith('$2') ? rawPass : bcrypt.hashSync(rawPass, 10);
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
    return buildAdminDocument(created);
  };

  // 2. Enquiry Model Hooks
  attachCollectionHooks(EnquiryModel, 'enquiries', (enquiryData, newId, now) => ({
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
  }));

  // 3. Application Model Hooks
  attachCollectionHooks(ApplicationModel, 'applications', (appData, newId, now) => ({
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
  }));

  // 4. ContentItem Model Hooks
  if (ContentItemModel) {
    ContentItemModel.find = function (query = {}) {
      const data = loadData();
      const filtered = (data.content || []).filter(c => {
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
  saveData,
  syncDevAdmins
};
