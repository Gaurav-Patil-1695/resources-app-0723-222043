const { body } = require('express-validator');

/**
 * Validation schema for the public promo code validation endpoint.
 * POST /validate
 */
const validatePromoCode = [
  body('code')
    .exists({ checkFalsy: true })
    .withMessage('Promo code is required.')
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.'),

  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer.'),

  body('orderTotal')
    .exists({ checkFalsy: false })
    .withMessage('orderTotal is required.')
    .isFloat({ min: 0 })
    .withMessage('orderTotal must be a non-negative number.'),

  body('items')
    .optional()
    .isArray()
    .withMessage('items must be an array.'),
];

/**
 * Validation schema for creating a new promo code.
 * POST /admin/promo-codes
 */
const validateCreatePromo = [
  body('code')
    .exists({ checkFalsy: true })
    .withMessage('Promo code is required.')
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.')
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage('Promo code may only contain letters, numbers, hyphens, and underscores.'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.')
    .isLength({ max: 255 })
    .withMessage('Description may not exceed 255 characters.'),

  body('discount_type')
    .exists({ checkFalsy: true })
    .withMessage('Discount type is required.')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed.'),

  body('discount_value')
    .exists({ checkFalsy: false })
    .withMessage('Discount value is required.')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.')
    .custom((value, { req }) => {
      if (req.body.discount_type === 'percentage' && (value <= 0 || value > 100)) {
        throw new Error('Percentage discount value must be between 1 and 100.');
      }
      return true;
    }),

  body('max_discount_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a non-negative number.'),

  body('min_order_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number.'),

  body('usage_limit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer.'),

  body('per_user_limit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Per-user limit must be a positive integer.'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean.'),

  body('starts_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('starts_at must be a valid ISO 8601 date.')
    .toDate(),

  body('expires_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('expires_at must be a valid ISO 8601 date.')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.starts_at && value && new Date(value) <= new Date(req.body.starts_at)) {
        throw new Error('expires_at must be after starts_at.');
      }
      return true;
    }),
];

/**
 * Validation schema for updating an existing promo code.
 * PUT /admin/promo-codes/:id
 * All fields are optional; only provided fields are validated.
 */
const validateUpdatePromo = [
  body('code')
    .optional()
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.')
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage('Promo code may only contain letters, numbers, hyphens, and underscores.'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string.')
    .isLength({ max: 255 })
    .withMessage('Description may not exceed 255 characters.'),

  body('discount_type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed.'),

  body('discount_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.')
    .custom((value, { req }) => {
      if (req.body.discount_type === 'percentage' && (value <= 0 || value > 100)) {
        throw new Error('Percentage discount value must be between 1 and 100.');
      }
      return true;
    }),

  body('max_discount_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a non-negative number.'),

  body('min_order_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number.'),

  body('usage_limit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer.'),

  body('per_user_limit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Per-user limit must be a positive integer.'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean.'),

  body('starts_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('starts_at must be a valid ISO 8601 date.')
    .toDate(),

  body('expires_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('expires_at must be a valid ISO 8601 date.')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.starts_at && value && new Date(value) <= new Date(req.body.starts_at)) {
        throw new Error('expires_at must be after starts_at.');
      }
      return true;
    }),
];

module.exports = {
  validatePromoCode,
  validateCreatePromo,
  validateUpdatePromo,
};
