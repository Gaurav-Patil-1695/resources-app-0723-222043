'use strict';

/**
 * Generic validation middleware factory for Joi schemas.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against.
 * @param {'body'|'query'|'params'} [source='body'] - The request property to validate.
 * @returns {Function} Express middleware that validates req[source] and calls next().
 */
function validate(schema, source = 'body') {
  return function (req, res, next) {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details,
      });
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;
