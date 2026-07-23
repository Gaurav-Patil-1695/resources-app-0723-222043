const db = require('../knex');

const PRODUCTS_TABLE = 'products';
const IMAGES_TABLE = 'product_images';

// products table
const findById = (id) =>
  db(PRODUCTS_TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(PRODUCTS_TABLE).where({ slug }).first();

const findAll = ({ limit = 20, offset = 0, categoryId, brandId, isActive } = {}) => {
  const query = db(PRODUCTS_TABLE).limit(limit).offset(offset);
  if (categoryId !== undefined) query.where({ category_id: categoryId });
  if (brandId !== undefined) query.where({ brand_id: brandId });
  if (isActive !== undefined) query.where({ is_active: isActive });
  return query;
};

const count = ({ categoryId, brandId, isActive } = {}) => {
  const query = db(PRODUCTS_TABLE).count('id as total').first();
  if (categoryId !== undefined) query.where({ category_id: categoryId });
  if (brandId !== undefined) query.where({ brand_id: brandId });
  if (isActive !== undefined) query.where({ is_active: isActive });
  return query;
};

const create = (data) =>
  db(PRODUCTS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(PRODUCTS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(PRODUCTS_TABLE).where({ id }).del();

const search = ({ query, limit = 20, offset = 0 }) =>
  db(PRODUCTS_TABLE)
    .whereILike('name', `%${query}%`)
    .orWhereILike('description', `%${query}%`)
    .limit(limit)
    .offset(offset);

// product_images table
const findImagesByProductId = (productId) =>
  db(IMAGES_TABLE).where({ product_id: productId }).orderBy('sort_order', 'asc');

const findImageById = (id) =>
  db(IMAGES_TABLE).where({ id }).first();

const addImage = (data) =>
  db(IMAGES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateImageById = (id, data) =>
  db(IMAGES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteImageById = (id) =>
  db(IMAGES_TABLE).where({ id }).del();

const deleteImagesByProductId = (productId) =>
  db(IMAGES_TABLE).where({ product_id: productId }).del();

const findProductWithImages = async (productId) => {
  const product = await findById(productId);
  if (!product) return null;
  const images = await findImagesByProductId(productId);
  return { ...product, images };
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  count,
  create,
  updateById,
  deleteById,
  search,
  findImagesByProductId,
  findImageById,
  addImage,
  updateImageById,
  deleteImageById,
  deleteImagesByProductId,
  findProductWithImages,
};
