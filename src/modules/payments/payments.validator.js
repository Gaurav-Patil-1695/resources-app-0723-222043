const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to collect and return validation errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({
        field: e.param,
        message: e.msg,
      })),
    });
  }
  return next();
}

/**
 * Validation rules for POST /payments/initiate
 */
const validateInitiatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .notEmpty()
    .withMessage('Currency is required.')
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO code.'),

  body('orderId')
    .optional()
    .isString()
    .withMessage('Order ID must be a string.'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/callback
 */
const validateCallback = [
  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string.'),

  body('providerReference')
    .optional()
    .isString()
    .withMessage('Provider reference must be a string.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isString()
    .withMessage('Status must be a string.')
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Status must be one of: pending, completed, failed, cancelled.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/:paymentId/retry
 */
const validateRetry = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required.')
    .isString()
    .withMessage('Payment ID must be a string.'),

  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO code.'),

  handleValidationErrors,
];

module.exports = {
  validateInitiatePayment,
  validateCallback,
  validateRetry,
};
