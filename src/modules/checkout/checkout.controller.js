const checkoutService = require('./checkout.service');

/**
 * POST /checkout/start
 * Initiates a checkout session. Supports guest and authenticated users.
 */
async function startCheckout(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const guestEmail = req.body.guestEmail || null;
    const cartId = req.body.cartId;

    const session = await checkoutService.initiateCheckout({ userId, guestEmail, cartId });
    return res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /checkout/address
 * Submits shipping/billing address for the current checkout session.
 */
async function submitAddress(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const { sessionId, shippingAddress, billingAddress, sameAsBilling } = req.body;

    const result = await checkoutService.submitAddress({
      sessionId,
      userId,
      shippingAddress,
      billingAddress: sameAsBilling ? shippingAddress : billingAddress,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /checkout/review
 * Returns a summary of the current checkout session for review before placing order.
 */
async function reviewCheckout(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.query.sessionId;

    const review = await checkoutService.reviewCheckout({ sessionId, userId });
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /checkout/place-order
 * Finalises the checkout: confirms stock, applies promos, creates order, delegates payment.
 */
async function placeOrder(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const { sessionId, paymentMethod, promoCode } = req.body;

    const order = await checkoutService.placeOrder({
      sessionId,
      userId,
      paymentMethod,
      promoCode,
    });
    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
