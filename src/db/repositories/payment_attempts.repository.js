const db = require('../knex');

const TABLE = 'payment_attempts';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');

const findLatestByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc').first();

const findByGatewayReference = (gatewayReference) =>
  db(TABLE).where({ gateway_reference: gatewayReference }).first();

const findByStatus = (status, { limit = 20, offset = 0 } = {}) =>
  db(TABLE).where({ status }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status) =>
  db(TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const countByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).count('id as total').first();

module.exports = {
  findById,
  findByOrderId,
  findLatestByOrderId,
  findByGatewayReference,
  findByStatus,
  create,
  updateById,
  updateStatus,
  deleteById,
  countByOrderId,
};
