'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { Application } = require('../src/models/Application');
const { generateApplicationReceiptHtml, escapeHtml } = require('../src/services/receipt.service');

describe('Application Receipt Automation', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('escapeHtml should properly escape HTML entities to prevent XSS in print slips', () => {
    const raw = '<script>alert("xss")</script> & \'test\'';
    const escaped = escapeHtml(raw);
    assert.equal(escaped.includes('<script>'), false);
    assert.equal(escaped.includes('&lt;script&gt;'), true);
    assert.equal(escaped.includes('&amp;'), true);
    assert.equal(escaped.includes('&#039;test&#039;'), true);
  });

  it('generateApplicationReceiptHtml should render institutional headers, candidate details, and checklist', () => {
    const mockApp = {
      applicationNumber: 'KSIN-2026-APP-1234',
      applicantName: 'Sneha Patel',
      dob: '2004-05-12',
      gender: 'Female',
      category: 'OBC',
      fatherName: 'Dinesh Patel',
      motherName: 'Sunita Patel',
      phone: '9876543210',
      email: 'sneha@example.com',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      address: { street: 'Station Road', district: 'Gaya', state: 'Bihar', pincode: '823001' },
      academicDetails: {
        tenthBoard: 'BSEB',
        tenthYear: 2020,
        tenthPercentage: 84.5,
        twelfthBoard: 'BSEB',
        twelfthYear: 2022,
        twelfthPercentage: 79.2,
        pcbPercentage: 81.0
      },
      documents: {
        tenthMarksheet: 'tenth.pdf',
        twelfthMarksheet: 'twelfth.pdf',
        idProof: 'aadhaar.pdf',
        photo: 'photo.jpg'
      },
      status: 'submitted',
      createdAt: '2026-02-10T10:30:00.000Z'
    };

    const html = generateApplicationReceiptHtml(mockApp);
    assert.ok(html.includes('Kavya Shree Institute of Nursing'));
    assert.ok(html.includes('KSIN-2026-APP-1234'));
    assert.ok(html.includes('Sneha Patel'));
    assert.ok(html.includes('Bachelor of Science in Nursing (B.Sc.)'));
    assert.ok(html.includes('84.5%'));
    assert.ok(html.includes('79.2%'));
    assert.ok(html.includes('81%'));
    assert.ok(html.includes('Uploaded'));
    assert.ok(html.includes('Print / Save as PDF'));
  });

  it('GET /api/applications/:appNumber/receipt should return 404 for nonexistent application', async () => {
    mock.method(Application, 'findOne', async () => null);

    const res = await request(app).get('/api/applications/KSIN-NONEXISTENT-9999/receipt');
    assert.equal(res.status, 404);
    assert.ok(res.text.includes('Application Not Found'));
  });

  it('GET /api/applications/:appNumber/receipt should return 200 with printable slip when application exists', async () => {
    const mockApplication = {
      _id: '67c805fa5f91725555555555',
      id: '67c805fa5f91725555555555',
      applicationNumber: 'KSIN-2026-APP-5555',
      applicantName: 'Komal Sharma',
      gender: 'Female',
      dob: '2005-08-20',
      fatherName: 'Rajesh Sharma',
      motherName: 'Kavita Sharma',
      phone: '9876543210',
      email: 'komal@example.com',
      category: 'General',
      address: {
        street: 'Main Road',
        district: 'Muzaffarpur',
        state: 'Bihar',
        pincode: '842001'
      },
      program: 'General Nursing & Midwifery (GNM)',
      academicDetails: {
        tenthBoard: 'CBSE',
        tenthYear: 2021,
        tenthPercentage: 81,
        twelfthBoard: 'CBSE',
        twelfthYear: 2023,
        twelfthPercentage: 76,
        pcbPercentage: 74
      },
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    mock.method(Application, 'findOne', async (query) => {
      if (query.applicationNumber === 'KSIN-2026-APP-5555' || query._id === '67c805fa5f91725555555555') {
        return mockApplication;
      }
      return null;
    });

    const receiptRes = await request(app).get('/api/applications/KSIN-2026-APP-5555/receipt');
    assert.equal(receiptRes.status, 200);
    assert.match(receiptRes.headers['content-type'], /text\/html/);
    assert.ok(receiptRes.text.includes('KSIN-2026-APP-5555'));
    assert.ok(receiptRes.text.includes('Komal Sharma'));
    assert.ok(receiptRes.text.includes('General Nursing &amp; Midwifery (GNM)'));
  });
});
