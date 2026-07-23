const { body, validationResult } = require('express-validator');

/**
 * Formats validation errors and sends a 422 response if any exist.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Validation schema for POST /checkout/start (initiate)
 */
const validateCheckoutStart = [
  body('cartId')
    .notEmpty()
    .withMessage('Cart ID is required.')
    .isString()
    .withMessage('Cart ID must be a string.'),

  body('guestEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Guest email must be a valid email address.'),

  handleValidationErrors,
];

/**
 * Reusable address sub-schema builder.
 */
function addressSchema(prefix, label) {
  return [
    body(`${prefix}.fullName`)
      .notEmpty()
      .withMessage(`${label} full name is required.`)
      .isString()
      .withMessage(`${label} full name must be a string.`),

    body(`${prefix}.line1`)
      .notEmpty()
      .withMessage(`${label} address line 1 is required.`)
      .isString()
      .withMessage(`${label} address line 1 must be a string.`),

    body(`${prefix}.line2`)
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .withMessage(`${label} address line 2 must be a string.`),

    body(`${prefix}.city`)
      .notEmpty()
      .withMessage(`${label} city is required.`)
      .isString()
      .withMessage(`${label} city must be a string.`),

    body(`${prefix}.state`)
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .withMessage(`${label} state must be a string.`),

    body(`${prefix}.postalCode`)
      .notEmpty()
      .withMessage(`${label} postal code is required.`)
      .isString()
      .withMessage(`${label} postal code must be a string.`),

    body(`${prefix}.country`)
      .notEmpty()
      .withMessage(`${label} country is required.`)
      .isString()
      .withMessage(`${label} country must be a string.`)
      .isLength({ min: 2, max: 2 })
      .withMessage(`${label} country must be a valid 2-letter ISO country code.`),
  ];
}

/**
 * Validation schema for POST /checkout/address
 */
const validateCheckoutAddress = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required.')
    .isString()
    .withMessage('Session ID must be a string.'),

  body('sameAsBilling')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('sameAsBilling must be a boolean.'),

  ...addressSchema('shippingAddress', 'Shipping'),

  // Billing address is conditionally required — validated in service when sameAsBilling is false.
  // Provide structural validation when present.
  body('billingAddress')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Billing address must be an object.'),

  body('billingAddress.fullName')
    .if(body('sameAsBilling').not().equals('true'))
    .optional()
    .isString()
    .withMessage('Billing full name must be a string.'),

  body('billingAddress.line1')
    .if(body('sameAsBilling').not().equals('true'))
    .optional()
    .isString()
    .withMessage('Billing address line 1 must be a string.'),

  body('billingAddress.city')
    .if(body('sameAsBilling').not().equals('true'))
    .optional()
    .isString()
    .withMessage('Billing city must be a string.'),

  body('billingAddress.postalCode')
    .if(body('sameAsBilling').not().equals('true'))
    .optional()
    .isString()
    .withMessage('Billing postal code must be a string.'),

  body('billingAddress.country')
    .if(body('sameAsBilling').not().equals('true'))
    .optional()
    .isString()
    .withMessage('Billing country must be a string.'),

  handleValidationErrors,
];

/**
 * Validation schema for POST /checkout/place-order (confirm)
 */
const validateCheckoutPlaceOrder = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required.')
    .isString()
    .withMessage('Session ID must be a string.'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required.')
    .isString()
    .withMessage('Payment method must be a string.'),

  body('promoCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Promo code must be a string.')
    .isLength({ max: 50 })
    .withMessage('Promo code must not exceed 50 characters.'),

  handleValidationErrors,
];

module.exports = {
  validateCheckoutStart,
  validateCheckoutAddress,
  validateCheckoutPlaceOrder,
};
