const db = require('../../db');
const { NotFoundError } = require('../../errors/NotFoundError');
const { ConflictError } = require('../../errors/ConflictError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(page, limit) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  return { parsedPage, parsedLimit, offset };
}

function buildSortClause(sortBy, sortOrder, allowedFields, defaultField) {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `${field} ${order}`;
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function listProducts(filters) {
  const { categoryId, brandId, minPrice, maxPrice, search, page, limit, sortBy, sortOrder } = filters;
  const { parsedPage, parsedLimit, offset } = buildPagination(page, limit);
  const sort = buildSortClause(
    sortBy,
    sortOrder,
    ['name', 'base_price', 'created_at'],
    'created_at'
  );

  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (brandId) {
    params.push(brandId);
    conditions.push(`p.brand_id = $${params.length}`);
  }
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    params.push(Number(minPrice));
    conditions.push(`p.base_price >= $${params.length}`);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    params.push(Number(maxPrice));
    conditions.push(`p.base_price <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countParams = [...params];
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    ${where}
  `;
  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total, 10);

  params.push(parsedLimit);
  params.push(offset);
  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.category_id,
      p.brand_id,
      p.status,
      p.created_at,
      p.updated_at,
      b.name AS brand_name,
      c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
    LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
    ${where}
    ORDER BY p.${sort}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const dataResult = await db.query(dataQuery, params);

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function getProductById(productId) {
  const query = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.category_id,
      p.brand_id,
      p.status,
      p.created_at,
      p.updated_at,
      b.name AS brand_name,
      c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
    LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `;
  const result = await db.query(query, [productId]);
  if (!result.rows.length) {
    throw new NotFoundError('Product not found.');
  }
  return result.rows[0];
}

async function createProduct(data) {
  const { name, slug, description, base_price, category_id, brand_id, status } = data;

  const existing = await db.query(
    'SELECT id FROM products WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  );
  if (existing.rows.length) {
    throw new ConflictError('A product with this slug already exists.');
  }

  const result = await db.query(
    `INSERT INTO products (name, slug, description, base_price, category_id, brand_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [name, slug, description || null, base_price, category_id || null, brand_id || null, status || 'draft']
  );
  return result.rows[0];
}

async function updateProduct(productId, data) {
  const product = await getProductById(productId);

  if (data.slug && data.slug !== product.slug) {
    const existing = await db.query(
      'SELECT id FROM products WHERE slug = $1 AND deleted_at IS NULL AND id != $2',
      [data.slug, productId]
    );
    if (existing.rows.length) {
      throw new ConflictError('A product with this slug already exists.');
    }
  }

  const fields = [];
  const params = [];

  const updatable = ['name', 'slug', 'description', 'base_price', 'category_id', 'brand_id', 'status'];
  updatable.forEach((key) => {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  });

  if (!fields.length) {
    return product;
  }

  params.push(productId);
  const result = await db.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteProduct(productId) {
  await getProductById(productId);
  await db.query(
    'UPDATE products SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [productId]
  );
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

async function listSkus(productId) {
  await getProductById(productId);
  const result = await db.query(
    `SELECT * FROM skus WHERE product_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function getSkuById(productId, skuId) {
  await getProductById(productId);
  const result = await db.query(
    `SELECT * FROM skus WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL`,
    [skuId, productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('SKU not found.');
  }
  return result.rows[0];
}

async function createSku(productId, data) {
  await getProductById(productId);
  const { sku_code, attributes, price, stock_quantity } = data;

  const existing = await db.query(
    'SELECT id FROM skus WHERE sku_code = $1 AND deleted_at IS NULL',
    [sku_code]
  );
  if (existing.rows.length) {
    throw new ConflictError('A SKU with this code already exists.');
  }

  const result = await db.query(
    `INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [productId, sku_code, JSON.stringify(attributes || {}), price, stock_quantity || 0]
  );
  return result.rows[0];
}

async function updateSku(productId, skuId, data) {
  const sku = await getSkuById(productId, skuId);

  if (data.sku_code && data.sku_code !== sku.sku_code) {
    const existing = await db.query(
      'SELECT id FROM skus WHERE sku_code = $1 AND deleted_at IS NULL AND id != $2',
      [data.sku_code, skuId]
    );
    if (existing.rows.length) {
      throw new ConflictError('A SKU with this code already exists.');
    }
  }

  const fields = [];
  const params = [];

  const updatable = ['sku_code', 'price', 'stock_quantity'];
  updatable.forEach((key) => {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  });

  if (data.attributes !== undefined) {
    params.push(JSON.stringify(data.attributes));
    fields.push(`attributes = $${params.length}`);
  }

  if (!fields.length) {
    return sku;
  }

  params.push(skuId);
  const result = await db.query(
    `UPDATE skus SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteSku(productId, skuId) {
  await getSkuById(productId, skuId);
  await db.query(
    'UPDATE skus SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [skuId]
  );
}

// ─── Product Images ───────────────────────────────────────────────────────────

async function listProductImages(productId) {
  await getProductById(productId);
  const result = await db.query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function addProductImage(productId, data) {
  await getProductById(productId);
  const { url, alt_text, sort_order } = data;

  const result = await db.query(
    `INSERT INTO product_images (product_id, url, alt_text, sort_order, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [productId, url, alt_text || null, sort_order || 0]
  );
  return result.rows[0];
}

async function deleteProductImage(productId, imageId) {
  await getProductById(productId);
  const result = await db.query(
    'SELECT id FROM product_images WHERE id = $1 AND product_id = $2',
    [imageId, productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Product image not found.');
  }
  await db.query('DELETE FROM product_images WHERE id = $1', [imageId]);
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories() {
  const result = await db.query(
    `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC`
  );
  return result.rows;
}

async function getCategoryById(categoryId) {
  const result = await db.query(
    `SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`,
    [categoryId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Category not found.');
  }
  return result.rows[0];
}

async function listProductsByCategory(categoryId, filters) {
  await getCategoryById(categoryId);
  const { page, limit, sortBy, sortOrder } = filters;
  const { parsedPage, parsedLimit, offset } = buildPagination(page, limit);
  const sort = buildSortClause(
    sortBy,
    sortOrder,
    ['name', 'base_price', 'created_at'],
    'created_at'
  );

  const countResult = await db.query(
    'SELECT COUNT(*) AS total FROM products WHERE category_id = $1 AND deleted_at IS NULL',
    [categoryId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await db.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.category_id, p.brand_id, p.status, p.created_at, p.updated_at,
       b.name AS brand_name
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
     WHERE p.category_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.${sort}
     LIMIT $2 OFFSET $3`,
    [categoryId, parsedLimit, offset]
  );

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function createCategory(data) {
  const { name, slug, description, parent_id } = data;

  const existing = await db.query(
    'SELECT id FROM categories WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  );
  if (existing.rows.length) {
    throw new ConflictError('A category with this slug already exists.');
  }

  const result = await db.query(
    `INSERT INTO categories (name, slug, description, parent_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [name, slug, description || null, parent_id || null]
  );
  return result.rows[0];
}

async function updateCategory(categoryId, data) {
  const category = await getCategoryById(categoryId);

  if (data.slug && data.slug !== category.slug) {
    const existing = await db.query(
      'SELECT id FROM categories WHERE slug = $1 AND deleted_at IS NULL AND id != $2',
      [data.slug, categoryId]
    );
    if (existing.rows.length) {
      throw new ConflictError('A category with this slug already exists.');
    }
  }

  const fields = [];
  const params = [];

  const updatable = ['name', 'slug', 'description', 'parent_id'];
  updatable.forEach((key) => {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  });

  if (!fields.length) {
    return category;
  }

  params.push(categoryId);
  const result = await db.query(
    `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteCategory(categoryId) {
  await getCategoryById(categoryId);
  const products = await db.query(
    'SELECT id FROM products WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1',
    [categoryId]
  );
  if (products.rows.length) {
    throw new ConflictError('Cannot delete a category that has associated products.');
  }
  await db.query(
    'UPDATE categories SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [categoryId]
  );
}

// ─── Brands ───────────────────────────────────────────────────────────────────

async function listBrands() {
  const result = await db.query(
    `SELECT * FROM brands WHERE deleted_at IS NULL ORDER BY name ASC`
  );
  return result.rows;
}

async function getBrandById(brandId) {
  const result = await db.query(
    `SELECT * FROM brands WHERE id = $1 AND deleted_at IS NULL`,
    [brandId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Brand not found.');
  }
  return result.rows[0];
}

async function createBrand(data) {
  const { name, slug, description, image_url } = data;

  const existing = await db.query(
    'SELECT id FROM brands WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  );
  if (existing.rows.length) {
    throw new ConflictError('A brand with this slug already exists.');
  }

  const result = await db.query(
    `INSERT INTO brands (name, slug, description, image_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [name, slug, description || null, image_url || null]
  );
  return result.rows[0];
}

async function updateBrand(brandId, data) {
  const brand = await getBrandById(brandId);

  if (data.slug && data.slug !== brand.slug) {
    const existing = await db.query(
      'SELECT id FROM brands WHERE slug = $1 AND deleted_at IS NULL AND id != $2',
      [data.slug, brandId]
    );
    if (existing.rows.length) {
      throw new ConflictError('A brand with this slug already exists.');
    }
  }

  const fields = [];
  const params = [];

  const updatable = ['name', 'slug', 'description', 'image_url'];
  updatable.forEach((key) => {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  });

  if (!fields.length) {
    return brand;
  }

  params.push(brandId);
  const result = await db.query(
    `UPDATE brands SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteBrand(brandId) {
  await getBrandById(brandId);
  const products = await db.query(
    'SELECT id FROM products WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1',
    [brandId]
  );
  if (products.rows.length) {
    throw new ConflictError('Cannot delete a brand that has associated products.');
  }
  await db.query(
    'UPDATE brands SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [brandId]
  );
}

module.exports = {
  // Products
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // SKUs
  listSkus,
  getSkuById,
  createSku,
  updateSku,
  deleteSku,
  // Images
  listProductImages,
  addProductImage,
  deleteProductImage,
  // Categories
  listCategories,
  getCategoryById,
  listProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  // Brands
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
