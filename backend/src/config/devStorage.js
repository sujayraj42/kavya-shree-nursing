'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'dev-database.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'kavya-shree-dev-database.json');

// Pre-computed bcrypt hashes for local development store only (no plaintext passwords in source).
const FALLBACK_ADMIN_HASHES = [
  '$2b$10$L.ayK.hEab6nYFSFjiH5seLWr4LbbVxzIKOuaIjsahPI.XT6njDM.',
  '$2b$10$L.ayK.hEab6nYFSFjiH5sexcrzMTa7DwR7n6uDY37Zzu3.icGBjM6'
];

// Builds development administrators from pre-computed hashes plus optional environment overrides.
function getDevAdmins() {
  const admins = [
    {
      _id: '671e6245d8b7a12345678900',
      id: '671e6245d8b7a12345678900',
      email: 'admin@kavyashreenursing.edu.in',
      name: 'Dr. System Administrator',
      role: 'superadmin',
      passwords: [...FALLBACK_ADMIN_HASHES],
      lastLoginAt: null
    },
    {
      _id: '671e6245d8b7a12345678999',
      id: '671e6245d8b7a12345678999',
      email: 'admin@edu.in',
      name: 'Institute Administrator',
      role: 'superadmin',
      passwords: [...FALLBACK_ADMIN_HASHES],
      lastLoginAt: null
    }
  ];

  const envEmail = (process.env.DEV_ADMIN_EMAIL || process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const envPassword = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || '';
  if (envEmail && envPassword.length >= 8 && !admins.some(a => a.email === envEmail)) {
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

// Default initial dataset for local development (sample enquiries only)
function getDefaultDataset() {
  return {
    admins: getDevAdmins(),
    enquiries: [
      {
        _id: '671e6245d8b7a12345678901',
        id: '671e6245d8b7a12345678901',
        name: 'Pooja Kumari',
        phone: '9876543210',
        email: 'pooja.kumari@example.com',
        program: 'General Nursing & Midwifery (GNM)',
        message: 'Interested in clinical rotation and hostel accommodation details.',
        consent: true,
        status: 'new',
        notes: [],
        createdAt: new Date('2026-10-25T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-25T10:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678902',
        id: '671e6245d8b7a12345678902',
        name: 'Rohit Sharma',
        phone: '9876543211',
        email: 'rohit.sharma@example.com',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        message: 'Seeking scholarship and admission consultation.',
        consent: true,
        status: 'contacted',
        notes: [
          {
            id: '671e6245d8b7a12345678931',
            author: 'Institute Administrator',
            text: 'Telephoned candidate; shared fee structure and syllabus overview.',
            createdAt: new Date('2026-10-25T11:00:00Z').toISOString()
          }
        ],
        createdAt: new Date('2026-10-25T09:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-25T11:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678903',
        id: '671e6245d8b7a12345678903',
        name: 'Ananya Sen',
        phone: '9876543212',
        email: 'ananya.sen@example.com',
        program: 'Auxiliary Nursing & Midwifery (ANM)',
        message: 'Requesting syllabus and session commencement schedule.',
        consent: true,
        status: 'in_review',
        notes: [],
        createdAt: new Date('2026-10-24T14:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-24T14:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678904',
        id: '671e6245d8b7a12345678904',
        name: 'Rajesh Verma',
        phone: '9876543213',
        email: 'rajesh.v@example.com',
        program: 'Post Basic B.Sc. Nursing',
        message: 'Registered working nurse looking for weekend clinical batches.',
        consent: true,
        status: 'admitted',
        notes: [],
        createdAt: new Date('2026-10-24T12:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-24T12:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678905',
        id: '671e6245d8b7a12345678905',
        name: 'Sneha Patel',
        phone: '9876543214',
        email: null,
        program: 'Master of Science in Nursing (M.Sc.)',
        message: 'Interested in pediatric and community nursing specializations.',
        consent: true,
        status: 'closed',
        notes: [],
        createdAt: new Date('2026-10-23T16:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-23T16:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678906',
        id: '671e6245d8b7a12345678906',
        name: 'Deepak Kumar',
        phone: '9876543215',
        email: 'deepak.k@example.com',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        message: 'Inquiring on entrance test cut-offs.',
        consent: true,
        status: 'new',
        notes: [],
        createdAt: new Date('2026-10-23T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-23T10:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678907',
        id: '671e6245d8b7a12345678907',
        name: 'Meera Nair',
        phone: '9876543216',
        email: 'meera.nair@example.com',
        program: 'Auxiliary Nursing & Midwifery (ANM)',
        message: '',
        consent: true,
        status: 'contacted',
        notes: [],
        createdAt: new Date('2026-10-22T08:30:00Z').toISOString(),
        updatedAt: new Date('2026-10-22T08:30:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678908',
        id: '671e6245d8b7a12345678908',
        name: 'Vikas Singh',
        phone: '9876543217',
        email: 'vikas.singh@example.com',
        program: 'General Nursing & Midwifery (GNM)',
        message: 'Hostel accommodation mandatory.',
        consent: true,
        status: 'closed',
        notes: [],
        createdAt: new Date('2026-10-21T15:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-21T15:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678909',
        id: '671e6245d8b7a12345678909',
        name: 'Priya Gupta',
        phone: '9876543218',
        email: 'priya.gupta@example.com',
        program: 'General Nursing & Midwifery (GNM)',
        message: '',
        consent: true,
        status: 'in_review',
        notes: [],
        createdAt: new Date('2026-10-20T11:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-20T11:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678910',
        id: '671e6245d8b7a12345678910',
        name: 'Amit Mishra',
        phone: '9876543219',
        email: 'amit.mishra@example.com',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        message: '',
        consent: true,
        status: 'admitted',
        notes: [],
        createdAt: new Date('2026-10-19T12:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-19T12:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678911',
        id: '671e6245d8b7a12345678911',
        name: 'Kavita Rao',
        phone: '9876543220',
        email: 'kavita.rao@example.com',
        program: 'Post Basic B.Sc. Nursing',
        message: 'Seeking scholarship details.',
        consent: true,
        status: 'new',
        notes: [],
        createdAt: new Date('2026-10-18T13:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-18T13:00:00Z').toISOString()
      },
      {
        _id: '671e6245d8b7a12345678912',
        id: '671e6245d8b7a12345678912',
        name: 'Suresh Yadav',
        phone: '9876543221',
        email: 'suresh.yadav@example.com',
        program: 'Master of Science in Nursing (M.Sc.)',
        message: '',
        consent: true,
        status: 'new',
        notes: [],
        createdAt: new Date('2026-10-17T14:00:00Z').toISOString(),
        updatedAt: new Date('2026-10-17T14:00:00Z').toISOString()
      }
    ]
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
