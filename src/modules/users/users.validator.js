const Joi = require('joi');

/**
 * Validation schema for PATCH /users/me
 */
const updateProfile = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'First name must not be empty.',
    'string.min': 'First name must be at least 1 character.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Last name must not be empty.',
    'string.min': 'Last name must be at least 1 character.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string().trim().max(30).optional().allow('', null).messages({
    'string.max': 'Phone number must not exceed 30 characters.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

/**
 * Validation schema for POST /users/me/change-password
 */
const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required.',
    'string.empty': 'Current password must not be empty.',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'any.required': 'New password is required.',
    'string.empty': 'New password must not be empty.',
    'string.min': 'New password must be at least 8 characters.',
    'string.max': 'New password must not exceed 128 characters.',
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.required': 'Password confirmation is required.',
    'string.empty': 'Password confirmation must not be empty.',
    'any.only': 'Passwords do not match.',
  }),
});

/**
 * Validation schema for PATCH /users/:userId (admin)
 */
const adminUpdateUser = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'First name must not be empty.',
    'string.min': 'First name must be at least 1 character.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Last name must not be empty.',
    'string.min': 'Last name must be at least 1 character.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string().trim().max(30).optional().allow('', null).messages({
    'string.max': 'Phone number must not exceed 30 characters.',
  }),
  role: Joi.string().valid('admin', 'user', 'moderator').optional().messages({
    'any.only': 'Role must be one of admin, user, or moderator.',
  }),
  is_active: Joi.boolean().optional().messages({
    'boolean.base': 'is_active must be a boolean value.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  updateProfile,
  changePassword,
  adminUpdateUser,
};
