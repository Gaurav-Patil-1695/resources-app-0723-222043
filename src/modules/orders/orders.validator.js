const { body, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Allowed values
// ---------------------------------------------------------------------------

const ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

// ---------------------------------------------------------------------------
// Validation rule sets
// ---------------------------------------------------------------------------

const validateAdvanceOrder = [
  body('status')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('status is required.')
    .isString()
    .withMessage('status must be a string.')
    .isIn(ALLOWED_STATUSES)
    .withMessage(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`),

  body('note')
    .optional()
    .isString()
    .withMessage('note must be a string.')
    .isLength({ max: 1000 })
    .withMessage('note must not exceed 1000 characters.'),

  handleValidationErrors,
];

const validateCancelOrder = [
  body('reason')
    .optional()
    .isString()
    .withMessage('reason must be a string.')
    .isLength({ max: 1000 })
    .withMessage('reason must not exceed 1000 characters.'),

  handleValidationErrors,
];

const validateReturnRequest = [
  body('reason')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('reason is required.')
    .isString()
    .withMessage('reason must be a string.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('reason must be between 10 and 2000 characters.'),

  body('items')
    .optional()
    .isArray()
    .withMessage('items must be an array.'),

  body('items.*.product_id')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must have a product_id.')
    .isString()
    .withMessage('product_id must be a string.'),

  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must have a quantity.')
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive integer.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Middleware helper
// ---------------------------------------------------------------------------

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed.',
      details: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  return next();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
};
