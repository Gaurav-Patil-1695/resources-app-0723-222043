const express = require('express');
const router = express.Router();
const promotionsController = require('./promotions.controller');
const { validatePromoCode, validateCreatePromo, validateUpdatePromo } = require('./promotions.validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorizeAdmin } = require('../../middleware/authorizeAdmin');

// Public route: validate a promo code
router.post(
  '/validate',
  validatePromoCode,
  validate,
  promotionsController.validatePromoCode
);

// Admin routes: CRUD for promo codes
router.get(
  '/admin/promo-codes',
  authenticate,
  authorizeAdmin,
  promotionsController.getAllPromoCodes
);

router.get(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  promotionsController.getPromoCodeById
);

router.post(
  '/admin/promo-codes',
  authenticate,
  authorizeAdmin,
  validateCreatePromo,
  validate,
  promotionsController.createPromoCode
);

router.put(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  validateUpdatePromo,
  validate,
  promotionsController.updatePromoCode
);

router.delete(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  promotionsController.deletePromoCode
);

module.exports = router;
