const express = require('express');
const router = express.Router({ mergeParams: true });
const returnsController = require('./returns.controller');
const { validateReturnRequest, validateReviewRequest } = require('./returns.validator');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// Customer routes (mounted under /orders/:orderId)
router.post(
  '/orders/:orderId/return-requests',
  authenticate,
  validateReturnRequest,
  returnsController.createReturnRequest
);

router.get(
  '/orders/:orderId/return-requests/:returnRequestId',
  authenticate,
  returnsController.getReturnRequestByOrder
);

// Admin routes
router.get(
  '/return-requests',
  authenticate,
  requireAdmin,
  returnsController.listReturnRequests
);

router.get(
  '/return-requests/:returnRequestId',
  authenticate,
  requireAdmin,
  returnsController.getReturnRequest
);

router.post(
  '/return-requests/:returnRequestId/review',
  authenticate,
  requireAdmin,
  validateReviewRequest,
  returnsController.reviewReturnRequest
);

module.exports = router;
