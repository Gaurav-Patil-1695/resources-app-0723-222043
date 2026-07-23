const db = require('../knex');

const ORDERS_TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const HISTORY_TABLE = 'order_status_history';
const TRACKING_TABLE = 'order_tracking';

// orders table
const findById = (id) =>
  db(ORDERS_TABLE).where({ id }).first();

const findByOrderNumber = (orderNumber) =>
  db(ORDERS_TABLE).where({ order_number: orderNumber }).first();

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(ORDERS_TABLE).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const query = db(ORDERS_TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);
  if (status !== undefined) query.where({ status });
  return query;
};

const count = ({ userId, status } = {}) => {
  const query = db(ORDERS_TABLE).count('id as total').first();
  if (userId !== undefined) query.where({ user_id: userId });
  if (status !== undefined) query.where({ status });
  return query;
};

const create = (data) =>
  db(ORDERS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(ORDERS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status) =>
  db(ORDERS_TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(ORDERS_TABLE).where({ id }).del();

// order_items table
const findItemsByOrderId = (orderId) =>
  db(ITEMS_TABLE).where({ order_id: orderId });

const findItemById = (id) =>
  db(ITEMS_TABLE).where({ id }).first();

const addItem = (data) =>
  db(ITEMS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const addItems = (items) =>
  db(ITEMS_TABLE).insert(items).returning('*');

const updateItemById = (id, data) =>
  db(ITEMS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteItemsByOrderId = (orderId) =>
  db(ITEMS_TABLE).where({ order_id: orderId }).del();

// order_status_history table
const findStatusHistoryByOrderId = (orderId) =>
  db(HISTORY_TABLE).where({ order_id: orderId }).orderBy('created_at', 'asc');

const addStatusHistory = (data) =>
  db(HISTORY_TABLE).insert(data).returning('*').then((rows) => rows[0]);

// order_tracking table
const findTrackingByOrderId = (orderId) =>
  db(TRACKING_TABLE).where({ order_id: orderId }).first();

const createTracking = (data) =>
  db(TRACKING_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateTrackingByOrderId = (orderId, data) =>
  db(TRACKING_TABLE).where({ order_id: orderId }).update(data).returning('*').then((rows) => rows[0]);

const findOrderWithDetails = async (orderId) => {
  const order = await findById(orderId);
  if (!order) return null;
  const [items, statusHistory, tracking] = await Promise.all([
    findItemsByOrderId(orderId),
    findStatusHistoryByOrderId(orderId),
    findTrackingByOrderId(orderId),
  ]);
  return { ...order, items, statusHistory, tracking };
};

module.exports = {
  findById,
  findByOrderNumber,
  findByUserId,
  findAll,
  count,
  create,
  updateById,
  updateStatus,
  deleteById,
  findItemsByOrderId,
  findItemById,
  addItem,
  addItems,
  updateItemById,
  deleteItemsByOrderId,
  findStatusHistoryByOrderId,
  addStatusHistory,
  findTrackingByOrderId,
  createTracking,
  updateTrackingByOrderId,
  findOrderWithDetails,
};
