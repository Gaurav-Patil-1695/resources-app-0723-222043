const db = require('../knex');

const TABLE = 'brands';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findByName = (name) =>
  db(TABLE).where({ name }).first();

const findAll = ({ limit = 100, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const findAllActive = ({ limit = 100, offset = 0 } = {}) =>
  db(TABLE).where({ is_active: true }).limit(limit).offset(offset);

const count = () =>
  db(TABLE).count('id as total').first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

module.exports = {
  findById,
  findBySlug,
  findByName,
  findAll,
  findAllActive,
  count,
  create,
  updateById,
  deleteById,
};
