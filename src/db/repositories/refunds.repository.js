const db = require('../knex');

const TABLE = 'refunds';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');

const findByPaymentAttemptId = (paymentAttemptId) =>
  db(TABLE).where({ payment_attempt_id: paymentAttemptId });

const findByGatewayRefundId = (gatewayRefundId) =>
  db(TABLE).where({ gateway_refund_id: gatewayRefundId }).first();

const findByStatus = (status, { limit = 20, offset = 0 } = {}) =>
  db(TABLE).where({ status }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findAll = ({ limit = 20, offset = 0 } = {}) =>
  db(TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status) =>
  db(TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const sumRefundedByOrderId = (orderId) =>
  db(TABLE)
    .where({ order_id: orderId, status: 'succeeded' })
    .sum('amount as total')
    .first();

module.exports = {
  findById,
  findByOrderId,
  findByPaymentAttemptId,
  findByGatewayRefundId,
  findByStatus,
  findAll,
  create,
  updateById,
  updateStatus,
  deleteById,
  sumRefundedByOrderId,
};
