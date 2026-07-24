let { nodeEnv } = require('../config/env');

module.exports = function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;

  // Mongoose-specific cases worth translating
  if (err.name === 'ValidationError') {
    status = 400;
  } else if (err.code === 11000) {
    status = 409;
    err.message = 'That already exists';
  } else if (err.name === 'CastError') {
    status = 400;
    err.message = 'Invalid ID';
  }

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: err.message || 'Something went wrong',
    ...(nodeEnv === 'development' && status === 500 ? { stack: err.stack } : {}),
  });
};