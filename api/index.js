'use strict';

const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/database');

let dbInitialized = false;

module.exports = async function handler(req, res) {
  if (!dbInitialized) {
    await connectDB({ allowDevStore: true });
    dbInitialized = true;
  }
  return app(req, res);
};
