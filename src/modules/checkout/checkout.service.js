const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

// In-memory session store — replace with Redis or DB-backed sessions in production
const checkoutSessions = new Map();

/**
 * Initiates a new checkout session.
 * Validates the cart exists and belongs to the user/guest.
 */
async function initiateCheckout({ userId, guestEmail, cartId }) {
  if (!cartId) {
    const err = new Error('Cart ID is required to initiate checkout.');
    err.status = 400;
    throw err;
  }

  // Fetch cart items
  const cartItems = await db('cart_items')
    .join('products', 'cart_items.product_id', 'products.id')
    .where('cart_items.cart_id', cartId)
    .select(
      'cart_items.id',
      'cart_items.product_id',
      'cart_items.quantity',
      'products.name',
      'products.price',
      'products.stock_quantity'
    );

  if (!cartItems || cartItems.length === 0) {
    const err = new Error('Cart is empty or does not exist.');
    err.status = 400;
    throw err;
  }

  // Verify stock availability
  for (const item of cartItems) {
    if (item.quantity > item.stock_quantity) {
      const err = new Error(
        `Insufficient stock for product "${item.name}". Available: ${item.stock_quantity}, requested: ${item.quantity}.`
      );
      err.status = 409;
      throw err;
    }
  }

  const sessionId = uuidv4();
  const session = {
    sessionId,
    cartId,
    userId: userId || null,
    guestEmail: guestEmail || null,
    cartItems,
    shippingAddress: null,
    billingAddress: null,
    promoCode: null,
    discount: 0,
    status: 'initiated',
    createdAt: Date.now(),
  };

  checkoutSessions.set(sessionId, session);

  return {
    sessionId,
    itemCount: cartItems.length,
    status: session.status,
  };
}

/**
 * Validates and stores shipping/billing address for a checkout session.
 */
async function submitAddress({ sessionId, userId, shippingAddress, billingAddress }) {
  const session = _getSession(sessionId);
  _assertSessionOwner(session, userId);

  // Validate address fields
  _validateAddress(shippingAddress, 'shipping');
  _validateAddress(billingAddress, 'billing');

  session.shippingAddress = shippingAddress;
  session.billingAddress = billingAddress;
  session.status = 'address_submitted';

  return {
    sessionId,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    status: session.status,
  };
}

/**
 * Returns a full summary of the checkout session for the review step.
 */
async function reviewCheckout({ sessionId, userId }) {
  const session = _getSession(sessionId);
  _assertSessionOwner(session, userId);

  if (!session.shippingAddress) {
    const err = new Error('Shipping address must be submitted before reviewing checkout.');
    err.status = 400;
    throw err;
  }

  const subtotal = session.cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const discount = session.discount || 0;
  const total = Math.max(0, subtotal - discount);

  return {
    sessionId,
    cartItems: session.cartItems.map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      lineTotal: parseFloat(item.price) * item.quantity,
    })),
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    promoCode: session.promoCode,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: session.status,
  };
}

/**
 * Places the order:
 *  1. Confirms stock reservation
 *  2. Applies promo code if provided
 *  3. Creates the order record
 *  4. Delegates payment intent creation
 *  5. Clears the session
 */
async function placeOrder({ sessionId, userId, paymentMethod, promoCode }) {
  const session = _getSession(sessionId);
  _assertSessionOwner(session, userId);

  if (!session.shippingAddress) {
    const err = new Error('Shipping address is required before placing an order.');
    err.status = 400;
    throw err;
  }

  // Step 1: Confirm stock reservation
  await _confirmStockReservation(session.cartItems);

  // Step 2: Apply promo code
  let discount = 0;
  let appliedPromo = null;
  if (promoCode) {
    const promoResult = await _finalisePromo(promoCode, session.cartItems);
    discount = promoResult.discount;
    appliedPromo = promoResult.promo;
  }

  // Step 3: Calculate totals
  const subtotal = session.cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);

  // Step 4: Create order record
  const orderId = await _createOrder({
    userId: session.userId,
    guestEmail: session.guestEmail,
    cartItems: session.cartItems,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    subtotal,
    discount,
    total,
    promoCode: appliedPromo ? appliedPromo.code : null,
    paymentMethod,
  });

  // Step 5: Delegate payment intent
  const paymentIntent = await _createPaymentIntent({
    orderId,
    amount: total,
    currency: 'usd',
    paymentMethod,
  });

  // Update order with payment intent reference
  await db('orders').where({ id: orderId }).update({
    payment_intent_id: paymentIntent.id,
    status: 'pending_payment',
    updated_at: db.fn.now(),
  });

  // Deduct stock
  for (const item of session.cartItems) {
    await db('products')
      .where({ id: item.product_id })
      .decrement('stock_quantity', item.quantity);
  }

  // Invalidate session
  checkoutSessions.delete(sessionId);

  return {
    orderId,
    status: 'pending_payment',
    total: parseFloat(total.toFixed(2)),
    paymentIntentId: paymentIntent.id,
    paymentClientSecret: paymentIntent.clientSecret,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function _getSession(sessionId) {
  if (!sessionId) {
    const err = new Error('Session ID is required.');
    err.status = 400;
    throw err;
  }
  const session = checkoutSessions.get(sessionId);
  if (!session) {
    const err = new Error('Checkout session not found or has expired.');
    err.status = 404;
    throw err;
  }
  return session;
}

function _assertSessionOwner(session, userId) {
  if (session.userId && userId && session.userId !== userId) {
    const err = new Error('You do not have access to this checkout session.');
    err.status = 403;
    throw err;
  }
}

function _validateAddress(address, type) {
  const required = ['fullName', 'line1', 'city', 'postalCode', 'country'];
  for (const field of required) {
    if (!address || !address[field] || String(address[field]).trim() === '') {
      const err = new Error(
        `${type.charAt(0).toUpperCase() + type.slice(1)} address field "${field}" is required.`
      );
      err.status = 422;
      throw err;
    }
  }
}

async function _confirmStockReservation(cartItems) {
  for (const item of cartItems) {
    const product = await db('products')
      .where({ id: item.product_id })
      .select('id', 'name', 'stock_quantity')
      .first();

    if (!product) {
      const err = new Error(`Product with ID ${item.product_id} no longer exists.`);
      err.status = 409;
      throw err;
    }

    if (product.stock_quantity < item.quantity) {
      const err = new Error(
        `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}.`
      );
      err.status = 409;
      throw err;
    }
  }
}

async function _finalisePromo(promoCode, cartItems) {
  const promo = await db('promo_codes')
    .where({ code: promoCode, active: true })
    .where('expires_at', '>', db.fn.now())
    .first();

  if (!promo) {
    const err = new Error('Promo code is invalid or has expired.');
    err.status = 422;
    throw err;
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = subtotal * (parseFloat(promo.discount_value) / 100);
  } else if (promo.discount_type === 'fixed') {
    discount = parseFloat(promo.discount_value);
  }

  return { discount, promo };
}

async function _createOrder({
  userId,
  guestEmail,
  cartItems,
  shippingAddress,
  billingAddress,
  subtotal,
  discount,
  total,
  promoCode,
  paymentMethod,
}) {
  const [orderId] = await db('orders').insert({
    user_id: userId || null,
    guest_email: guestEmail || null,
    items: JSON.stringify(
      cartItems.map((item) => ({
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
      }))
    ),
    shipping_address: JSON.stringify(shippingAddress),
    billing_address: JSON.stringify(billingAddress),
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    promo_code: promoCode || null,
    payment_method: paymentMethod,
    payment_intent_id: null,
    status: 'created',
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return orderId;
}

async function _createPaymentIntent({ orderId, amount, currency, paymentMethod }) {
  // Delegate to payment service / Stripe SDK — stub implementation.
  // Replace with actual payment provider integration.
  return {
    id: `pi_${uuidv4().replace(/-/g, '')}`,
    clientSecret: `pi_secret_${uuidv4().replace(/-/g, '')}`,
    amount,
    currency,
    orderId,
  };
}

module.exports = {
  initiateCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
