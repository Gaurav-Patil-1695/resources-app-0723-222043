const db = require('../knex');

const TABLE = 'return_requests';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(TABLE).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findByStatus = (status, { limit = 20, offset = 0 } = {}) =>
  db(TABLE).where({ status }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const query = db(TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);
  if (status !== undefined) query.where({ status });
  return query;
};

const count = ({ userId, status } = {}) => {
  const query = db(TABLE).count('id as total').first();
  if (userId !== undefined) query.where({ user_id: userId });
  if (status !== undefined) query.where({ status });
  return query;
};

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status) =>
  db(TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

module.exports = {
  findById,
  findByOrderId,
  findByUserId,
  findByStatus,
  findAll,
  count,
  create,
  updateById,
  updateStatus,
  deleteById,
};
