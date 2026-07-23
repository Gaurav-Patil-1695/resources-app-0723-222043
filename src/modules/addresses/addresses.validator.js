const { body } = require('express-validator');

const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const createAddressRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters.'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .matches(PHONE_REGEX)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number.'),

  body('address_line1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required.')
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters.'),

  body('address_line2')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters.'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required.')
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters.'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required.')
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters.'),

  body('pin_code')
    .trim()
    .notEmpty()
    .withMessage('Pin code is required.')
    .matches(PIN_CODE_REGEX)
    .withMessage('Pin code must be a valid 6-digit Indian pin code.'),

  body('country')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters.'),

  body('is_default')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('is_default must be a boolean value.'),
];

const updateAddressRules = [
  body('full_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name must not be empty.')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters.'),

  body('phone')
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number.'),

  body('address_line1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address line 1 must not be empty.')
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters.'),

  body('address_line2')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters.'),

  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City must not be empty.')
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters.'),

  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State must not be empty.')
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters.'),

  body('pin_code')
    .optional()
    .trim()
    .matches(PIN_CODE_REGEX)
    .withMessage('Pin code must be a valid 6-digit Indian pin code.'),

  body('country')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters.'),

  body('is_default')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('is_default must be a boolean value.'),
];

const validateCreateAddress = createAddressRules;
const validateUpdateAddress = updateAddressRules;

module.exports = {
  validateCreateAddress,
  validateUpdateAddress,
};
