const Joi = require('joi');

// ─── Shared Patterns ──────────────────────────────────────────────────────────

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugSchema = Joi.string()
  .pattern(slugPattern)
  .max(255)
  .messages({
    'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens.',
    'string.max': 'Slug must not exceed 255 characters.',
    'string.empty': 'Slug is required.',
    'any.required': 'Slug is required.',
  });

// ─── Product Validators ───────────────────────────────────────────────────────

const createProduct = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Product name is required.',
    'string.min': 'Product name must be at least 1 character.',
    'string.max': 'Product name must not exceed 255 characters.',
    'any.required': 'Product name is required.',
  }),
  slug: slugSchema.required(),
  description: Joi.string().max(5000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Base price must be a number.',
    'number.min': 'Base price must be at least 0.',
    'any.required': 'Base price is required.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Category ID must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Brand ID must be a valid UUID.',
  }),
  status: Joi.string().valid('draft', 'active', 'archived').optional().default('draft').messages({
    'any.only': 'Status must be one of: draft, active, archived.',
  }),
});

const updateProduct = Joi.object({
  name: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Product name must not be empty.',
    'string.min': 'Product name must be at least 1 character.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  slug: slugSchema.optional(),
  description: Joi.string().max(5000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().precision(2).min(0).optional().messages({
    'number.base': 'Base price must be a number.',
    'number.min': 'Base price must be at least 0.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Category ID must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Brand ID must be a valid UUID.',
  }),
  status: Joi.string().valid('draft', 'active', 'archived').optional().messages({
    'any.only': 'Status must be one of: draft, active, archived.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── SKU Validators ───────────────────────────────────────────────────────────

const createSku = Joi.object({
  sku_code: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'SKU code is required.',
    'string.min': 'SKU code must be at least 1 character.',
    'string.max': 'SKU code must not exceed 100 characters.',
    'any.required': 'SKU code is required.',
  }),
  attributes: Joi.object().optional().default({}).messages({
    'object.base': 'Attributes must be an object.',
  }),
  price: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Price must be a number.',
    'number.min': 'Price must be at least 0.',
    'any.required': 'Price is required.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Stock quantity must be a number.',
    'number.integer': 'Stock quantity must be an integer.',
    'number.min': 'Stock quantity must be at least 0.',
  }),
});

const updateSku = Joi.object({
  sku_code: Joi.string().min(1).max(100).optional().messages({
    'string.empty': 'SKU code must not be empty.',
    'string.min': 'SKU code must be at least 1 character.',
    'string.max': 'SKU code must not exceed 100 characters.',
  }),
  attributes: Joi.object().optional().messages({
    'object.base': 'Attributes must be an object.',
  }),
  price: Joi.number().precision(2).min(0).optional().messages({
    'number.base': 'Price must be a number.',
    'number.min': 'Price must be at least 0.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock quantity must be a number.',
    'number.integer': 'Stock quantity must be an integer.',
    'number.min': 'Stock quantity must be at least 0.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── Product Image Validators ─────────────────────────────────────────────────

const addProductImage = Joi.object({
  url: Joi.string().uri().max(2048).required().messages({
    'string.empty': 'Image URL is required.',
    'string.uri': 'Image URL must be a valid URL.',
    'string.max': 'Image URL must not exceed 2048 characters.',
    'any.required': 'Image URL is required.',
  }),
  alt_text: Joi.string().max(255).optional().allow(null, '').messages({
    'string.max': 'Alt text must not exceed 255 characters.',
  }),
  sort_order: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Sort order must be a number.',
    'number.integer': 'Sort order must be an integer.',
    'number.min': 'Sort order must be at least 0.',
  }),
});

// ─── Category Validators ──────────────────────────────────────────────────────

const createCategory = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Category name is required.',
    'string.min': 'Category name must be at least 1 character.',
    'string.max': 'Category name must not exceed 255 characters.',
    'any.required': 'Category name is required.',
  }),
  slug: slugSchema.required(),
  description: Joi.string().max(2000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Parent ID must be a valid UUID.',
  }),
});

const updateCategory = Joi.object({
  name: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Category name must not be empty.',
    'string.min': 'Category name must be at least 1 character.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  slug: slugSchema.optional(),
  description: Joi.string().max(2000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Parent ID must be a valid UUID.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── Brand Validators ─────────────────────────────────────────────────────────

const createBrand = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Brand name is required.',
    'string.min': 'Brand name must be at least 1 character.',
    'string.max': 'Brand name must not exceed 255 characters.',
    'any.required': 'Brand name is required.',
  }),
  slug: slugSchema.required(),
  description: Joi.string().max(2000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).optional().allow(null, '').messages({
    'string.uri': 'Image URL must be a valid URL.',
    'string.max': 'Image URL must not exceed 2048 characters.',
  }),
});

const updateBrand = Joi.object({
  name: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Brand name must not be empty.',
    'string.min': 'Brand name must be at least 1 character.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  slug: slugSchema.optional(),
  description: Joi.string().max(2000).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).optional().allow(null, '').messages({
    'string.uri': 'Image URL must be a valid URL.',
    'string.max': 'Image URL must not exceed 2048 characters.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  createProduct,
  updateProduct,
  createSku,
  updateSku,
  addProductImage,
  createCategory,
  updateCategory,
  createBrand,
  updateBrand,
};
