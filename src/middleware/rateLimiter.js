'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication routes (login, register, etc.).
 * Allows a maximum of 10 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for password-reset routes.
 * Allows a maximum of 5 requests per 60-minute window per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many password reset attempts. Please try again after 1 hour.',
  },
  skipSuccessfulRequests: false,
});

module.exports = { authLimiter, passwordResetLimiter };
