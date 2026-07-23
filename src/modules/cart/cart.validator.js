const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validationHandler');

/**
 * Validation schema for creating a new cart.
 */
const validateCreateCart = [
  body('guestId')
    .optional()
    .isString()
    .withMessage('Guest ID must be a string.')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Guest ID must not exceed 255 characters.'),
  handleValidationErrors,
];

/**
 * Validation schema for adding an item to the cart.
 */
const validateAddItem = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required.')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer.'),
  body('variantId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Variant ID must be a positive integer.'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer.'),
  handleValidationErrors,
];

/**
 * Validation schema for updating a cart item's quantity.
 */
const validateUpdateItem = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer.'),
  handleValidationErrors,
];

/**
 * Validation schema for applying a promo code.
 */
const validateApplyPromo = [
  body('promoCode')
    .notEmpty()
    .withMessage('Promo code is required.')
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.'),
  handleValidationErrors,
];

module.exports = {
  validateCreateCart,
  validateAddItem,
  validateUpdateItem,
  validateApplyPromo,
};
