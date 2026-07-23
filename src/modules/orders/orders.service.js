const db = require('../../db');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];
const RETURNABLE_STATUSES = ['delivered'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNotFoundError(orderId) {
  const err = new Error(`Order ${orderId} not found.`);
  err.statusCode = 404;
  return err;
}

function createForbiddenError() {
  const err = new Error('You do not have permission to access this order.');
  err.statusCode = 403;
  return err;
}

function createConflictError(message) {
  const err = new Error(message);
  err.statusCode = 409;
  return err;
}

function isAdmin(user) {
  return user && user.role === 'admin';
}

function assertOrderAccess(order, user) {
  if (!isAdmin(user) && order.user_id !== user.id) {
    throw createForbiddenError();
  }
}

// ---------------------------------------------------------------------------
// Order list
// ---------------------------------------------------------------------------

async function listOrders({ page, limit, status, userId, requestingUser }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (!isAdmin(requestingUser)) {
    params.push(requestingUser.id);
    conditions.push(`o.user_id = $${params.length}`);
  } else if (userId) {
    params.push(userId);
    conditions.push(`o.user_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const { rows } = await db.query(
    `SELECT o.*, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS total FROM orders o ${where}`,
    countParams
  );

  return {
    data: rows,
    meta: {
      page,
      limit,
      total: parseInt(countRows[0].total, 10),
    },
  };
}

// ---------------------------------------------------------------------------
// Order detail
// ---------------------------------------------------------------------------

async function getOrderById(orderId, requestingUser) {
  const { rows } = await db.query(
    `SELECT o.*, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId]
  );

  if (!rows.length) throw createNotFoundError(orderId);
  const order = rows[0];
  assertOrderAccess(order, requestingUser);

  const { rows: items } = await db.query(
    `SELECT oi.*, p.name AS product_name, p.sku
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  order.items = items;
  return order;
}

// ---------------------------------------------------------------------------
// Order creation (called by checkout)
// ---------------------------------------------------------------------------

async function createOrder({ userId, items, shippingAddress, paymentMethod }, client) {
  const useClient = client || db;

  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const { rows } = await useClient.query(
    `INSERT INTO orders (user_id, status, total_amount, shipping_address, payment_method, created_at, updated_at)
     VALUES ($1, 'pending', $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [userId, total, JSON.stringify(shippingAddress), paymentMethod]
  );

  const order = rows[0];

  for (const item of items) {
    await useClient.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [order.id, item.product_id, item.quantity, item.unit_price]
    );
  }

  await writeStatusHistory(order.id, null, 'pending', 'Order created.', userId, useClient);

  return order;
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

async function advanceOrderStatus(orderId, newStatus, note, requestingUser) {
  if (!isAdmin(requestingUser)) throw createForbiddenError();
  if (!ORDER_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid status value: ${newStatus}.`);
    err.statusCode = 422;
    throw err;
  }

  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows.length) throw createNotFoundError(orderId);
  const order = rows[0];

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const newIndex = ORDER_STATUSES.indexOf(newStatus);

  if (newIndex <= currentIndex) {
    throw createConflictError(
      `Cannot transition order from '${order.status}' to '${newStatus}'.`
    );
  }

  const { rows: updated } = await db.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStatus, orderId]
  );

  await writeStatusHistory(
    orderId,
    order.status,
    newStatus,
    note || `Status advanced to ${newStatus}.`,
    requestingUser.id
  );

  if (newStatus === 'shipped') {
    await upsertOrderTracking(orderId, { status: 'in_transit' });
  } else if (newStatus === 'delivered') {
    await upsertOrderTracking(orderId, { status: 'delivered', delivered_at: new Date().toISOString() });
  }

  return updated[0];
}

async function cancelOrder(orderId, reason, requestingUser) {
  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows.length) throw createNotFoundError(orderId);
  const order = rows[0];

  assertOrderAccess(order, requestingUser);

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw createConflictError(
      `Order cannot be cancelled in its current status '${order.status}'.`
    );
  }

  const { rows: updated } = await db.query(
    `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [orderId]
  );

  await writeStatusHistory(
    orderId,
    order.status,
    'cancelled',
    reason || 'Order cancelled.',
    requestingUser.id
  );

  return updated[0];
}

// ---------------------------------------------------------------------------
// Return requests
// ---------------------------------------------------------------------------

async function createReturnRequest(orderId, payload, requestingUser) {
  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows.length) throw createNotFoundError(orderId);
  const order = rows[0];

  assertOrderAccess(order, requestingUser);

  if (!RETURNABLE_STATUSES.includes(order.status)) {
    throw createConflictError(
      `Returns can only be requested for delivered orders.`
    );
  }

  const { reason, items } = payload;

  const { rows: inserted } = await db.query(
    `INSERT INTO return_requests (order_id, user_id, reason, items, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
     RETURNING *`,
    [orderId, requestingUser.id, reason, JSON.stringify(items || [])]
  );

  return inserted[0];
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

async function getOrderTracking(orderId, requestingUser) {
  const { rows: orderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orderRows.length) throw createNotFoundError(orderId);
  assertOrderAccess(orderRows[0], requestingUser);

  const { rows } = await db.query(
    'SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY created_at DESC',
    [orderId]
  );

  return rows;
}

async function upsertOrderTracking(orderId, fields, client) {
  const useClient = client || db;
  const { rows: existing } = await useClient.query(
    'SELECT id FROM order_tracking WHERE order_id = $1',
    [orderId]
  );

  if (existing.length) {
    const setClauses = Object.keys(fields)
      .map((k, i) => `${k} = $${i + 2}`)
      .join(', ');
    await useClient.query(
      `UPDATE order_tracking SET ${setClauses}, updated_at = NOW() WHERE order_id = $1`,
      [orderId, ...Object.values(fields)]
    );
  } else {
    const columns = ['order_id', ...Object.keys(fields), 'created_at', 'updated_at'].join(', ');
    const placeholders = [orderId, ...Object.values(fields), 'NOW()', 'NOW()']
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    await useClient.query(
      `INSERT INTO order_tracking (${columns}) VALUES (${placeholders})`,
      [orderId, ...Object.values(fields)]
    );
  }
}

// ---------------------------------------------------------------------------
// Timeline (order_status_history)
// ---------------------------------------------------------------------------

async function getOrderTimeline(orderId, requestingUser) {
  const { rows: orderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orderRows.length) throw createNotFoundError(orderId);
  assertOrderAccess(orderRows[0], requestingUser);

  const { rows } = await db.query(
    `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );

  return rows;
}

async function writeStatusHistory(orderId, fromStatus, toStatus, note, actorId, client) {
  const useClient = client || db;
  await useClient.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, note, actor_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [orderId, fromStatus, toStatus, note, actorId]
  );
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

async function getOrderRefunds(orderId, requestingUser) {
  const { rows: orderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orderRows.length) throw createNotFoundError(orderId);
  assertOrderAccess(orderRows[0], requestingUser);

  const { rows } = await db.query(
    'SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC',
    [orderId]
  );

  return rows;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  advanceOrderStatus,
  cancelOrder,
  createReturnRequest,
  getOrderTracking,
  upsertOrderTracking,
  getOrderTimeline,
  writeStatusHistory,
  getOrderRefunds,
};
