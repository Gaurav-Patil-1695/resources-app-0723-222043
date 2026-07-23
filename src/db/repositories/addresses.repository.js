const db = require('../knex');

const TABLE = 'addresses';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUserId = (userId) =>
  db(TABLE).where({ user_id: userId });

const findDefaultByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_default: true }).first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const deleteByUserId = (userId) =>
  db(TABLE).where({ user_id: userId }).del();

const unsetDefaultForUser = (userId) =>
  db(TABLE).where({ user_id: userId, is_default: true }).update({ is_default: false });

const countByUserId = (userId) =>
  db(TABLE).where({ user_id: userId }).count('id as total').first();

module.exports = {
  findById,
  findByUserId,
  findDefaultByUserId,
  create,
  updateById,
  deleteById,
  deleteByUserId,
  unsetDefaultForUser,
  countByUserId,
};
