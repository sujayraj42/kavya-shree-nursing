'use strict';

const config = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Syntax error from body-parser for malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload'
    });
  }

  // Payload too large error
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload size exceeds allowable limit'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameter format'
    });
  }

  // Database connection failure or cluster selection timeout
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongooseServerSelectionError') {
    return res.status(503).json({
      success: false,
      error: 'Database service temporarily unavailable. Please try again later.'
    });
  }

  // Log error safely without logging sensitive enquiry content
  console.error('[ERROR] Request error occurred:', err.name || 'Error', err.message);

  const statusCode = err.status || err.statusCode || 500;
  const response = {
    success: false,
    error: config.isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error'
  };

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
