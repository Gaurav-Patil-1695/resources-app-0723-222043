const Joi = require('joi');
const { validationMiddleware } = require('../../middleware/validation');

const returnRequestSchema = Joi.object({
  reason: Joi.string().trim().min(1).max(500).required().messages({
    'string.base': 'Reason must be a string.',
    'string.empty': 'Reason is required.',
    'string.min': 'Reason must be at least 1 character.',
    'string.max': 'Reason must not exceed 500 characters.',
    'any.required': 'Reason is required.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.base': 'Description must be a string.',
    'string.max': 'Description must not exceed 2000 characters.',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.alternatives()
          .try(Joi.string().uuid(), Joi.number().integer().positive())
          .required()
          .messages({
            'any.required': 'Product ID is required for each item.',
          }),
        quantity: Joi.number().integer().positive().required().messages({
          'number.base': 'Quantity must be a number.',
          'number.integer': 'Quantity must be an integer.',
          'number.positive': 'Quantity must be greater than zero.',
          'any.required': 'Quantity is required for each item.',
        }),
      })
    )
    .optional()
    .messages({
      'array.base': 'Items must be an array.',
    }),
});

const reviewRequestSchema = Joi.object({
  decision: Joi.string().valid('approved', 'rejected').required().messages({
    'string.base': 'Decision must be a string.',
    'any.only': 'Decision must be one of approved, rejected.',
    'any.required': 'Decision is required.',
  }),
  notes: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.base': 'Notes must be a string.',
    'string.max': 'Notes must not exceed 2000 characters.',
  }),
});

const validateReturnRequest = validationMiddleware(returnRequestSchema);
const validateReviewRequest = validationMiddleware(reviewRequestSchema);

module.exports = {
  validateReturnRequest,
  validateReviewRequest,
  returnRequestSchema,
  reviewRequestSchema,
};
