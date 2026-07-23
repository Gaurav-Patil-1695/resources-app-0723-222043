const cartService = require('./cart.service');
const { HTTP_STATUS } = require('../../constants/httpStatus');

/**
 * POST /carts
 * Create a new cart (guest or authenticated)
 */
async function createCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const guestId = req.body.guestId || null;
    const cart = await cartService.createCart({ userId, guestId });
    return res.status(HTTP_STATUS.CREATED).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /carts/:cartId
 * Retrieve a cart and its items
 */
async function getCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.getCartById(cartId, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/items
 * Add an item to the cart
 */
async function addItem(req, res, next) {
  try {
    const { cartId } = req.params;
    const { productId, variantId, quantity } = req.body;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.addItem(cartId, { productId, variantId, quantity }, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /carts/:cartId/items/:itemId
 * Update quantity of a cart item
 */
async function updateItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.updateItem(cartId, itemId, { quantity }, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/items/:itemId
 * Remove an item from the cart
 */
async function removeItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removeItem(cartId, itemId, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/promo
 * Apply a promo code to the cart
 */
async function applyPromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const { promoCode } = req.body;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.applyPromo(cartId, promoCode, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/promo
 * Remove promo code from the cart
 */
async function removePromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removePromo(cartId, userId);
    return res.status(HTTP_STATUS.OK).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
