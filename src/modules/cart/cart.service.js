const db = require('../../db');
const { AppError } = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../constants/httpStatus');

/**
 * Create a new cart for a user or guest session.
 * If the user is authenticated and has an existing guest cart, merge them.
 */
async function createCart({ userId, guestId }) {
  return db.transaction(async (trx) => {
    // If authenticated user, check for existing active cart
    if (userId) {
      const existingCart = await trx('carts')
        .where({ user_id: userId, status: 'active' })
        .first();

      if (existingCart) {
        // If a guestId is provided, merge guest cart into existing user cart
        if (guestId) {
          await mergeGuestCartIntoUserCart(existingCart.id, guestId, trx);
        }
        return getCartWithItems(existingCart.id, trx);
      }

      // If guestId provided and no existing user cart, convert guest cart
      if (guestId) {
        const guestCart = await trx('carts')
          .where({ guest_id: guestId, status: 'active' })
          .first();

        if (guestCart) {
          await trx('carts').where({ id: guestCart.id }).update({
            user_id: userId,
            guest_id: null,
            updated_at: new Date(),
          });
          return getCartWithItems(guestCart.id, trx);
        }
      }
    }

    // Create a new cart
    const [newCart] = await trx('carts')
      .insert({
        user_id: userId || null,
        guest_id: guestId || null,
        status: 'active',
        promo_code: null,
        discount_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return getCartWithItems(newCart.id, trx);
  });
}

/**
 * Retrieve a cart with its items by cartId.
 */
async function getCartById(cartId, userId) {
  const cart = await db('carts').where({ id: cartId }).first();

  if (!cart) {
    throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
  }

  assertCartAccess(cart, userId);

  return getCartWithItems(cartId);
}

/**
 * Add an item to the cart. Validates stock availability.
 */
async function addItem(cartId, { productId, variantId, quantity }, userId) {
  return db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId, status: 'active' }).first();

    if (!cart) {
      throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertCartAccess(cart, userId);

    // Validate stock
    await validateStockAvailability(productId, variantId, quantity, null, trx);

    // Check if item already exists in cart
    const existingItem = await trx('cart_items')
      .where({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId || null,
      })
      .first();

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      await validateStockAvailability(productId, variantId, newQuantity, null, trx);

      await trx('cart_items').where({ id: existingItem.id }).update({
        quantity: newQuantity,
        updated_at: new Date(),
      });
    } else {
      await trx('cart_items').insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await trx('carts').where({ id: cartId }).update({ updated_at: new Date() });

    return getCartWithItems(cartId, trx);
  });
}

/**
 * Update the quantity of an existing cart item.
 */
async function updateItem(cartId, itemId, { quantity }, userId) {
  return db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId, status: 'active' }).first();

    if (!cart) {
      throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertCartAccess(cart, userId);

    const item = await trx('cart_items').where({ id: itemId, cart_id: cartId }).first();

    if (!item) {
      throw new AppError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (quantity <= 0) {
      await trx('cart_items').where({ id: itemId }).delete();
    } else {
      await validateStockAvailability(item.product_id, item.variant_id, quantity, itemId, trx);
      await trx('cart_items').where({ id: itemId }).update({
        quantity,
        updated_at: new Date(),
      });
    }

    await trx('carts').where({ id: cartId }).update({ updated_at: new Date() });

    return getCartWithItems(cartId, trx);
  });
}

/**
 * Remove an item from the cart.
 */
async function removeItem(cartId, itemId, userId) {
  return db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId, status: 'active' }).first();

    if (!cart) {
      throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertCartAccess(cart, userId);

    const item = await trx('cart_items').where({ id: itemId, cart_id: cartId }).first();

    if (!item) {
      throw new AppError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
    }

    await trx('cart_items').where({ id: itemId }).delete();
    await trx('carts').where({ id: cartId }).update({ updated_at: new Date() });

    return getCartWithItems(cartId, trx);
  });
}

/**
 * Apply a promo code to the cart.
 */
async function applyPromo(cartId, promoCode, userId) {
  return db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId, status: 'active' }).first();

    if (!cart) {
      throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertCartAccess(cart, userId);

    // Look up the promo code
    const promo = await trx('promo_codes')
      .where({ code: promoCode, is_active: true })
      .first();

    if (!promo) {
      throw new AppError('Promo code is invalid or has expired.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    const now = new Date();
    if (promo.expires_at && new Date(promo.expires_at) < now) {
      throw new AppError('Promo code is invalid or has expired.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (promo.starts_at && new Date(promo.starts_at) > now) {
      throw new AppError('Promo code is invalid or has expired.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    // Calculate discount
    const cartTotal = await calculateCartTotal(cartId, trx);
    let discountAmount = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = (cartTotal * promo.discount_value) / 100;
    } else if (promo.discount_type === 'fixed') {
      discountAmount = promo.discount_value;
    }

    discountAmount = Math.min(discountAmount, cartTotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    await trx('carts').where({ id: cartId }).update({
      promo_code: promoCode,
      discount_amount: discountAmount,
      updated_at: new Date(),
    });

    return getCartWithItems(cartId, trx);
  });
}

/**
 * Remove promo code from the cart.
 */
async function removePromo(cartId, userId) {
  return db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId, status: 'active' }).first();

    if (!cart) {
      throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
    }

    assertCartAccess(cart, userId);

    await trx('carts').where({ id: cartId }).update({
      promo_code: null,
      discount_amount: 0,
      updated_at: new Date(),
    });

    return getCartWithItems(cartId, trx);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch a cart with all its items (and computed totals).
 */
async function getCartWithItems(cartId, trx) {
  const query = trx || db;

  const cart = await query('carts').where({ id: cartId }).first();

  if (!cart) {
    throw new AppError('Cart not found.', HTTP_STATUS.NOT_FOUND);
  }

  const items = await query('cart_items as ci')
    .join('products as p', 'ci.product_id', 'p.id')
    .leftJoin('product_variants as pv', 'ci.variant_id', 'pv.id')
    .where('ci.cart_id', cartId)
    .select(
      'ci.id',
      'ci.cart_id',
      'ci.product_id',
      'ci.variant_id',
      'ci.quantity',
      'ci.created_at',
      'ci.updated_at',
      'p.name as product_name',
      'p.price as unit_price',
      'pv.name as variant_name',
      'pv.price_modifier'
    );

  const enrichedItems = items.map((item) => {
    const unitPrice = parseFloat(item.unit_price) + parseFloat(item.price_modifier || 0);
    return {
      id: item.id,
      cartId: item.cart_id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      productName: item.product_name,
      variantName: item.variant_name,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  });

  const subtotal = enrichedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const discountAmount = parseFloat(cart.discount_amount) || 0;
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  return {
    id: cart.id,
    userId: cart.user_id,
    guestId: cart.guest_id,
    status: cart.status,
    promoCode: cart.promo_code,
    discountAmount,
    subtotal: Math.round(subtotal * 100) / 100,
    total,
    items: enrichedItems,
    createdAt: cart.created_at,
    updatedAt: cart.updated_at,
  };
}

/**
 * Validate that a product/variant has sufficient stock for the requested quantity.
 */
async function validateStockAvailability(productId, variantId, quantity, excludeItemId, trx) {
  const query = trx || db;

  let stockQuery;
  if (variantId) {
    stockQuery = query('product_variants').where({ id: variantId, product_id: productId }).first();
  } else {
    stockQuery = query('products').where({ id: productId }).first();
  }

  const record = await stockQuery;

  if (!record) {
    throw new AppError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (record.stock_quantity !== undefined && record.stock_quantity !== null) {
    if (quantity > record.stock_quantity) {
      throw new AppError(
        'Requested quantity exceeds available stock.',
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      );
    }
  }
}

/**
 * Merge all items from a guest cart into a user cart.
 */
async function mergeGuestCartIntoUserCart(userCartId, guestId, trx) {
  const guestCart = await trx('carts')
    .where({ guest_id: guestId, status: 'active' })
    .first();

  if (!guestCart) return;

  const guestItems = await trx('cart_items').where({ cart_id: guestCart.id });

  for (const guestItem of guestItems) {
    const existingItem = await trx('cart_items')
      .where({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id,
      })
      .first();

    if (existingItem) {
      await trx('cart_items').where({ id: existingItem.id }).update({
        quantity: existingItem.quantity + guestItem.quantity,
        updated_at: new Date(),
      });
    } else {
      await trx('cart_items').insert({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id,
        quantity: guestItem.quantity,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  // Deactivate the guest cart
  await trx('carts').where({ id: guestCart.id }).update({
    status: 'merged',
    updated_at: new Date(),
  });
}

/**
 * Calculate the raw subtotal of a cart (before discounts).
 */
async function calculateCartTotal(cartId, trx) {
  const query = trx || db;

  const items = await query('cart_items as ci')
    .join('products as p', 'ci.product_id', 'p.id')
    .leftJoin('product_variants as pv', 'ci.variant_id', 'pv.id')
    .where('ci.cart_id', cartId)
    .select('ci.quantity', 'p.price', 'pv.price_modifier');

  return items.reduce((sum, item) => {
    const unitPrice = parseFloat(item.price) + parseFloat(item.price_modifier || 0);
    return sum + unitPrice * item.quantity;
  }, 0);
}

/**
 * Assert that the requesting user has access to the given cart.
 * Guests (userId = null) may access any cart for now; authenticated users must own it.
 */
function assertCartAccess(cart, userId) {
  if (userId && cart.user_id && cart.user_id !== userId) {
    throw new AppError('Access denied.', HTTP_STATUS.FORBIDDEN);
  }
}

module.exports = {
  createCart,
  getCartById,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
