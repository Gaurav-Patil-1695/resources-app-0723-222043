const paymentsService = require('./payments.service');

/**
 * POST /payments/initiate
 */
async function initiatePayment(req, res, next) {
  try {
    const result = await paymentsService.initiatePayment(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /payments/callback
 */
async function handleCallback(req, res, next) {
  try {
    const result = await paymentsService.handleCallback(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /payments/:paymentId
 */
async function getPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await paymentsService.getPaymentById(paymentId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /payments/:paymentId/retry
 */
async function retryPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await paymentsService.retryPayment(paymentId, req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  initiatePayment,
  handleCallback,
  getPayment,
  retryPayment,
};
