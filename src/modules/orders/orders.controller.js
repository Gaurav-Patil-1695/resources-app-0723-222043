const ordersService = require('./orders.service');

/**
 * GET /orders
 * List orders — supports pagination and filtering by status/user.
 */
async function listOrders(req, res, next) {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const result = await ordersService.listOrders({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      userId,
      requestingUser: req.user,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /orders/:orderId
 * Retrieve a single order by ID.
 */
async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await ordersService.getOrderById(orderId, req.user);
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /orders/:orderId/advance
 * Advance the order to the next status (admin).
 */
async function advanceOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const order = await ordersService.advanceOrderStatus(orderId, status, note, req.user);
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /orders/:orderId/cancel
 * Cancel an order.
 */
async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await ordersService.cancelOrder(orderId, reason, req.user);
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /orders/:orderId/return-requests
 * Create a return request for an order.
 */
async function createReturnRequest(req, res, next) {
  try {
    const { orderId } = req.params;
    const payload = req.body;
    const returnRequest = await ordersService.createReturnRequest(orderId, payload, req.user);
    return res.status(201).json(returnRequest);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /orders/:orderId/tracking
 * Retrieve tracking information for an order.
 */
async function getOrderTracking(req, res, next) {
  try {
    const { orderId } = req.params;
    const tracking = await ordersService.getOrderTracking(orderId, req.user);
    return res.status(200).json(tracking);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /orders/:orderId/timeline
 * Retrieve status history timeline for an order.
 */
async function getOrderTimeline(req, res, next) {
  try {
    const { orderId } = req.params;
    const timeline = await ordersService.getOrderTimeline(orderId, req.user);
    return res.status(200).json(timeline);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /orders/:orderId/refunds
 * Retrieve refunds associated with an order.
 */
async function getOrderRefunds(req, res, next) {
  try {
    const { orderId } = req.params;
    const refunds = await ordersService.getOrderRefunds(orderId, req.user);
    return res.status(200).json(refunds);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listOrders,
  getOrder,
  advanceOrder,
  cancelOrder,
  createReturnRequest,
  getOrderTracking,
  getOrderTimeline,
  getOrderRefunds,
};
