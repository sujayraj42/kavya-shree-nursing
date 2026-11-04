'use strict';

const mongoose = require('mongoose');
const app = require('../backend/src/app');

let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return;
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || 'kavya-shree-nursing',
    serverSelectionTimeoutMS: 5000
  });

  isConnected = true;
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.warn('[Vercel Serverless] DB connection note:', err.message);
  }
  return app(req, res);
};
