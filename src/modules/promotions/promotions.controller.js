const promotionsService = require('./promotions.service');

/**
 * POST /validate
 * Validate a promo code for a given order context.
 */
async function validatePromoCode(req, res, next) {
  try {
    const { code, userId, orderTotal, items } = req.body;
    const result = await promotionsService.validateAndApplyPromo({
      code,
      userId,
      orderTotal,
      items,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/promo-codes
 * Retrieve all promo codes (admin).
 */
async function getAllPromoCodes(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await promotionsService.getAllPromoCodes({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/promo-codes/:id
 * Retrieve a single promo code by ID (admin).
 */
async function getPromoCodeById(req, res, next) {
  try {
    const { id } = req.params;
    const promoCode = await promotionsService.getPromoCodeById(id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: promoCode });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/promo-codes
 * Create a new promo code (admin).
 */
async function createPromoCode(req, res, next) {
  try {
    const payload = req.body;
    const created = await promotionsService.createPromoCode(payload);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/promo-codes/:id
 * Update an existing promo code (admin).
 */
async function updatePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await promotionsService.updatePromoCode(id, payload);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/promo-codes/:id
 * Delete a promo code (admin).
 */
async function deletePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await promotionsService.deletePromoCode(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validatePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
