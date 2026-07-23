'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Morgan HTTP request logging middleware backed by Winston.
 *
 * Uses the "combined" Apache log format in production and a concise
 * "dev" format in all other environments.  Log output is streamed
 * through the shared Winston logger so that every HTTP event appears
 * in the same structured log pipeline as application events.
 */

const morganFormat =
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

const stream = {
  write(message) {
    logger.http(message.trim());
  },
};

const requestLogger = morgan(morganFormat, { stream });

module.exports = requestLogger;
