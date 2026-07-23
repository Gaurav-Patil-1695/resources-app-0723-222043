const db = require('../../db');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../errors');

const RETURNABLE_STATUSES = ['delivered'];
const RETURN_WINDOW_DAYS = 30;
const REVIEWABLE_STATUSES = ['pending'];

const checkReturnEligibility = async (orderId, customerId) => {
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) {
    throw new NotFoundError('Order not found.');
  }
  if (String(order.customer_id) !== String(customerId)) {
    throw new ForbiddenError('You do not have permission to return this order.');
  }
  if (!RETURNABLE_STATUSES.includes(order.status)) {
    throw new ConflictError('Order is not eligible for return.');
  }
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at);
  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - deliveredAt.getTime() > windowMs) {
    throw new ConflictError('Return window has expired.');
  }
  const existing = await db('return_requests')
    .where({ order_id: orderId })
    .whereNot({ status: 'rejected' })
    .first();
  if (existing) {
    throw new ConflictError('A return request already exists for this order.');
  }
  return order;
};

const initiateReturn = async (orderId, customerId, payload) => {
  await checkReturnEligibility(orderId, customerId);
  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      customer_id: customerId,
      reason: payload.reason,
      description: payload.description || null,
      items: payload.items ? JSON.stringify(payload.items) : null,
      status: 'pending',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');
  return returnRequest;
};

const getReturnRequestByOrder = async (orderId, returnRequestId, customerId) => {
  const returnRequest = await db('return_requests')
    .where({ id: returnRequestId, order_id: orderId })
    .first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }
  if (String(returnRequest.customer_id) !== String(customerId)) {
    throw new ForbiddenError('You do not have permission to view this return request.');
  }
  return returnRequest;
};

const listReturnRequests = async (filters) => {
  const { status, page, limit } = filters;
  const offset = (page - 1) * limit;
  const query = db('return_requests').orderBy('created_at', 'desc');
  if (status) {
    query.where({ status });
  }
  const [{ count }] = await query.clone().count('id as count');
  const data = await query.limit(limit).offset(offset);
  return {
    data,
    meta: {
      total: parseInt(count, 10),
      page,
      limit,
    },
  };
};

const getReturnRequestById = async (returnRequestId) => {
  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }
  return returnRequest;
};

const triggerRefund = async (trx, returnRequest) => {
  const order = await trx('orders').where({ id: returnRequest.order_id }).first();
  await trx('refunds').insert({
    order_id: returnRequest.order_id,
    return_request_id: returnRequest.id,
    customer_id: returnRequest.customer_id,
    amount: order.total_amount,
    status: 'pending',
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
};

const restoreStock = async (trx, returnRequest) => {
  let items = returnRequest.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (_) {
      items = null;
    }
  }
  if (!items) {
    const orderItems = await trx('order_items').where({ order_id: returnRequest.order_id });
    items = orderItems;
  }
  for (const item of items) {
    await trx('products')
      .where({ id: item.product_id })
      .increment('stock_quantity', item.quantity || 1);
  }
};

const reviewReturnRequest = async (returnRequestId, reviewerId, payload) => {
  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }
  if (!REVIEWABLE_STATUSES.includes(returnRequest.status)) {
    throw new ConflictError('Return request has already been reviewed.');
  }
  const { decision, notes } = payload;
  const trx = await db.transaction();
  try {
    const [updated] = await trx('return_requests')
      .where({ id: returnRequestId })
      .update({
        status: decision,
        reviewer_id: reviewerId,
        review_notes: notes || null,
        reviewed_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('*');
    if (decision === 'approved') {
      await triggerRefund(trx, returnRequest);
      await restoreStock(trx, returnRequest);
    }
    await trx.commit();
    return updated;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};

module.exports = {
  initiateReturn,
  getReturnRequestByOrder,
  listReturnRequests,
  getReturnRequestById,
  reviewReturnRequest,
};
