const db = require('../knex');

const TABLE = 'skus';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySku = (sku) =>
  db(TABLE).where({ sku }).first();

const findByProductId = (productId) =>
  db(TABLE).where({ product_id: productId });

const findAll = ({ limit = 20, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

/**
 * Atomically decrement stock_quantity by `quantity` for the given sku id.
 * Only decrements if stock_quantity >= quantity.
 * Returns number of rows updated (1 = success, 0 = insufficient stock).
 */
const decrementStock = (id, quantity) =>
  db(TABLE)
    .where('id', id)
    .where('stock_quantity', '>=', quantity)
    .update({ stock_quantity: db.raw('stock_quantity - ?', [quantity]) });

/**
 * Atomically increment stock_quantity by `quantity` for the given sku id.
 */
const incrementStock = (id, quantity) =>
  db(TABLE)
    .where('id', id)
    .update({ stock_quantity: db.raw('stock_quantity + ?', [quantity]) });

/**
 * Atomically decrement stock within a provided transaction.
 * Returns number of rows updated.
 */
const decrementStockTrx = (trx, id, quantity) =>
  trx(TABLE)
    .where('id', id)
    .where('stock_quantity', '>=', quantity)
    .update({ stock_quantity: db.raw('stock_quantity - ?', [quantity]) });

/**
 * Atomically increment stock within a provided transaction.
 */
const incrementStockTrx = (trx, id, quantity) =>
  trx(TABLE)
    .where('id', id)
    .update({ stock_quantity: db.raw('stock_quantity + ?', [quantity]) });

const findWithSufficientStock = (id, quantity) =>
  db(TABLE).where('id', id).where('stock_quantity', '>=', quantity).first();

module.exports = {
  findById,
  findBySku,
  findByProductId,
  findAll,
  create,
  updateById,
  deleteById,
  decrementStock,
  incrementStock,
  decrementStockTrx,
  incrementStockTrx,
  findWithSufficientStock,
};
