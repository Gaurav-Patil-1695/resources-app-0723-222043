const db = require('../knex');

const TABLE = 'stock_reservations';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId });

const findBySkuId = (skuId) =>
  db(TABLE).where({ sku_id: skuId });

const findByOrderAndSku = (orderId, skuId) =>
  db(TABLE).where({ order_id: orderId, sku_id: skuId }).first();

const findActiveBySkuId = (skuId) =>
  db(TABLE).where({ sku_id: skuId, status: 'active' });

const sumReservedBySkuId = (skuId) =>
  db(TABLE)
    .where({ sku_id: skuId, status: 'active' })
    .sum('quantity as total')
    .first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const deleteByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).del();

const releaseByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).update({ status: 'released' });

const confirmByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).update({ status: 'confirmed' });

module.exports = {
  findById,
  findByOrderId,
  findBySkuId,
  findByOrderAndSku,
  findActiveBySkuId,
  sumReservedBySkuId,
  create,
  updateById,
  deleteById,
  deleteByOrderId,
  releaseByOrderId,
  confirmByOrderId,
};
