'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { Enquiry } = require('../src/models/Enquiry');
const { Application } = require('../src/models/Application');
const { Admin } = require('../src/models/Admin');
const { ContentItem } = require('../src/models/Content');

describe('Database Indexes and Schema Optimization', () => {
  test('Enquiry model should have compound and text indexes', () => {
    const indexes = Enquiry.schema.indexes();
    const indexFields = indexes.map(idx => Object.keys(idx[0]));

    // Verify compound deletedAt + status + createdAt index
    const hasDeletedStatus = indexes.some(idx => idx[0].deletedAt === 1 && idx[0].status === 1 && idx[0].createdAt === -1);
    assert.equal(hasDeletedStatus, true, 'Enquiry should have { deletedAt: 1, status: 1, createdAt: -1 } index');

    // Verify compound deletedAt + program + createdAt index
    const hasDeletedProgram = indexes.some(idx => idx[0].deletedAt === 1 && idx[0].program === 1 && idx[0].createdAt === -1);
    assert.equal(hasDeletedProgram, true, 'Enquiry should have { deletedAt: 1, program: 1, createdAt: -1 } index');

    // Verify text index for candidate search
    const hasTextIndex = indexes.some(idx => idx[0].name === 'text' && idx[0].phone === 'text');
    assert.equal(hasTextIndex, true, 'Enquiry should have text index on name and phone');
  });

  test('Application model should have compound and text indexes', () => {
    const indexes = Application.schema.indexes();

    const hasDeletedStatus = indexes.some(idx => idx[0].deletedAt === 1 && idx[0].status === 1 && idx[0].createdAt === -1);
    assert.equal(hasDeletedStatus, true, 'Application should have { deletedAt: 1, status: 1, createdAt: -1 } index');

    const hasTextIndex = indexes.some(idx => idx[0].applicantName === 'text' && idx[0].applicationNumber === 'text');
    assert.equal(hasTextIndex, true, 'Application should have text index on applicantName and applicationNumber');
  });

  test('Admin model should have index on email and isActive', () => {
    const indexes = Admin.schema.indexes();
    const hasActiveIndex = indexes.some(idx => idx[0].isActive === 1);
    assert.equal(hasActiveIndex, true, 'Admin should index isActive');
  });

  test('ContentItem model should have compound index on section, isActive, order', () => {
    const indexes = ContentItem.schema.indexes();
    const hasCompound = indexes.some(idx => idx[0].section === 1 && idx[0].isActive === 1 && idx[0].order === 1);
    assert.equal(hasCompound, true, 'ContentItem should have compound index on section + isActive + order');
  });
});

