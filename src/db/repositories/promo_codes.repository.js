const db = require('../knex');

const TABLE = 'promo_codes';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByCode = (code) =>
  db(TABLE).where({ code }).first();

const findAll = ({ limit = 20, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const findAllActive = () =>
  db(TABLE).where({ is_active: true });

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

/**
 * Atomically increment usage_count by 1 for a promo code.
 */
const incrementUsageCount = (id) =>
  db(TABLE)
    .where({ id })
    .update({ usage_count: db.raw('usage_count + 1') });

/**
 * Find a valid promo code: active, within date range, usage_limit not exceeded.
 */
const findValidByCode = (code) =>
  db(TABLE)
    .where({ code, is_active: true })
    .where((builder) => {
      builder
        .whereNull('valid_from')
        .orWhere('valid_from', '<=', db.fn.now());
    })
    .where((builder) => {
      builder
        .whereNull('valid_until')
        .orWhere('valid_until', '>=', db.fn.now());
    })
    .where((builder) => {
      builder
        .whereNull('usage_limit')
        .orWhereRaw('usage_count < usage_limit');
    })
    .first();

module.exports = {
  findById,
  findByCode,
  findAll,
  findAllActive,
  create,
  updateById,
  deleteById,
  incrementUsageCount,
  findValidByCode,
};
