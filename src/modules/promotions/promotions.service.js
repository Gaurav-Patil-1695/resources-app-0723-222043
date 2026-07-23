const db = require('../../db');

/**
 * Supported discount types.
 */
const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

/**
 * Calculate the discount amount for an order.
 * @param {Object} promoCode - The promo code record.
 * @param {number} orderTotal - The raw order total before discount.
 * @returns {number} discountAmount
 */
function calculateDiscount(promoCode, orderTotal) {
  if (promoCode.discount_type === DISCOUNT_TYPE.PERCENTAGE) {
    const amount = (promoCode.discount_value / 100) * orderTotal;
    if (promoCode.max_discount_amount && amount > promoCode.max_discount_amount) {
      return promoCode.max_discount_amount;
    }
    return parseFloat(amount.toFixed(2));
  }

  if (promoCode.discount_type === DISCOUNT_TYPE.FIXED) {
    const amount = Math.min(promoCode.discount_value, orderTotal);
    return parseFloat(amount.toFixed(2));
  }

  return 0;
}

/**
 * Check eligibility rules for a promo code.
 * Throws an error with a descriptive message if ineligible.
 * @param {Object} promoCode - The promo code record from the database.
 * @param {Object} context - { userId, orderTotal, items }
 */
async function checkEligibility(promoCode, { userId, orderTotal }) {
  const now = new Date();

  if (!promoCode.is_active) {
    throw new Error('This promo code is not active.');
  }

  if (promoCode.starts_at && new Date(promoCode.starts_at) > now) {
    throw new Error('This promo code is not yet valid.');
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at) < now) {
    throw new Error('This promo code has expired.');
  }

  if (promoCode.usage_limit !== null && promoCode.usage_count >= promoCode.usage_limit) {
    throw new Error('This promo code has reached its usage limit.');
  }

  if (promoCode.min_order_amount && orderTotal < promoCode.min_order_amount) {
    throw new Error(
      `A minimum order amount of ${promoCode.min_order_amount} is required to use this promo code.`
    );
  }

  if (promoCode.per_user_limit !== null && userId) {
    const usageRow = await db('promo_code_usages')
      .where({ promo_code_id: promoCode.id, user_id: userId })
      .count('id as count')
      .first();
    const userUsageCount = parseInt(usageRow.count, 10);
    if (userUsageCount >= promoCode.per_user_limit) {
      throw new Error('You have already used this promo code the maximum number of times.');
    }
  }
}

/**
 * Validate a promo code and return discount details without persisting usage.
 * @param {Object} params - { code, userId, orderTotal, items }
 * @returns {Object} - { promoCodeId, code, discountType, discountValue, discountAmount, finalTotal }
 */
async function validateAndApplyPromo({ code, userId, orderTotal, items }) {
  const promoCode = await db('promo_codes')
    .whereRaw('UPPER(code) = ?', [code.toUpperCase()])
    .first();

  if (!promoCode) {
    throw new Error('Invalid promo code.');
  }

  await checkEligibility(promoCode, { userId, orderTotal, items });

  const discountAmount = calculateDiscount(promoCode, orderTotal);
  const finalTotal = parseFloat((orderTotal - discountAmount).toFixed(2));

  return {
    promoCodeId: promoCode.id,
    code: promoCode.code,
    discountType: promoCode.discount_type,
    discountValue: promoCode.discount_value,
    discountAmount,
    finalTotal,
  };
}

/**
 * Record that a promo code was used by a user (called after order is confirmed).
 * Also increments the global usage_count.
 * @param {number} promoCodeId
 * @param {number} userId
 * @param {number} orderId
 */
async function recordPromoUsage(promoCodeId, userId, orderId) {
  await db.transaction(async (trx) => {
    await trx('promo_code_usages').insert({
      promo_code_id: promoCodeId,
      user_id: userId,
      order_id: orderId,
    });
    await trx('promo_codes').where({ id: promoCodeId }).increment('usage_count', 1);
  });
}

/**
 * Retrieve all promo codes with optional pagination and search.
 * @param {Object} params - { page, limit, search }
 * @returns {Object} - { items, total, page, limit }
 */
async function getAllPromoCodes({ page = 1, limit = 20, search }) {
  const offset = (page - 1) * limit;
  let query = db('promo_codes').orderBy('created_at', 'desc');

  if (search) {
    query = query.whereRaw('UPPER(code) LIKE ?', [`%${search.toUpperCase()}%`]);
  }

  const totalRow = await query.clone().count('id as count').first();
  const total = parseInt(totalRow.count, 10);
  const items = await query.offset(offset).limit(limit);

  return { items, total, page, limit };
}

/**
 * Retrieve a single promo code by its primary key.
 * @param {number} id
 * @returns {Object|null}
 */
async function getPromoCodeById(id) {
  const promoCode = await db('promo_codes').where({ id }).first();
  return promoCode || null;
}

/**
 * Create a new promo code.
 * @param {Object} payload
 * @returns {Object} - The created promo code record.
 */
async function createPromoCode(payload) {
  const {
    code,
    description,
    discount_type,
    discount_value,
    max_discount_amount,
    min_order_amount,
    usage_limit,
    per_user_limit,
    is_active,
    starts_at,
    expires_at,
  } = payload;

  const existing = await db('promo_codes')
    .whereRaw('UPPER(code) = ?', [code.toUpperCase()])
    .first();
  if (existing) {
    throw new Error('A promo code with this code already exists.');
  }

  const [id] = await db('promo_codes').insert({
    code: code.toUpperCase(),
    description: description || null,
    discount_type,
    discount_value,
    max_discount_amount: max_discount_amount || null,
    min_order_amount: min_order_amount || null,
    usage_limit: usage_limit || null,
    usage_count: 0,
    per_user_limit: per_user_limit || null,
    is_active: is_active !== undefined ? is_active : true,
    starts_at: starts_at || null,
    expires_at: expires_at || null,
  });

  return getPromoCodeById(id);
}

/**
 * Update an existing promo code.
 * @param {number} id
 * @param {Object} payload
 * @returns {Object|null} - The updated promo code record, or null if not found.
 */
async function updatePromoCode(id, payload) {
  const existing = await db('promo_codes').where({ id }).first();
  if (!existing) {
    return null;
  }

  if (payload.code) {
    const duplicate = await db('promo_codes')
      .whereRaw('UPPER(code) = ?', [payload.code.toUpperCase()])
      .whereNot({ id })
      .first();
    if (duplicate) {
      throw new Error('A promo code with this code already exists.');
    }
    payload.code = payload.code.toUpperCase();
  }

  await db('promo_codes').where({ id }).update(payload);
  return getPromoCodeById(id);
}

/**
 * Delete a promo code by ID.
 * @param {number} id
 * @returns {boolean} - True if deleted, false if not found.
 */
async function deletePromoCode(id) {
  const existing = await db('promo_codes').where({ id }).first();
  if (!existing) {
    return false;
  }
  await db('promo_codes').where({ id }).delete();
  return true;
}

module.exports = {
  validateAndApplyPromo,
  recordPromoUsage,
  calculateDiscount,
  checkEligibility,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  DISCOUNT_TYPE,
};
