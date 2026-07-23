const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { validateCreateCart, validateAddItem, validateUpdateItem, validateApplyPromo } = require('./cart.validator');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth');

// POST /carts - Create a new cart
router.post('/', optionalAuthenticate, validateCreateCart, cartController.createCart);

// GET /carts/:cartId - Get cart by ID
router.get('/:cartId', optionalAuthenticate, cartController.getCart);

// POST /carts/:cartId/items - Add item to cart
router.post('/:cartId/items', optionalAuthenticate, validateAddItem, cartController.addItem);

// PATCH /carts/:cartId/items/:itemId - Update cart item
router.patch('/:cartId/items/:itemId', optionalAuthenticate, validateUpdateItem, cartController.updateItem);

// DELETE /carts/:cartId/items/:itemId - Remove cart item
router.delete('/:cartId/items/:itemId', optionalAuthenticate, cartController.removeItem);

// POST /carts/:cartId/promo - Apply promo code
router.post('/:cartId/promo', optionalAuthenticate, validateApplyPromo, cartController.applyPromo);

// DELETE /carts/:cartId/promo - Remove promo code
router.delete('/:cartId/promo', optionalAuthenticate, cartController.removePromo);

module.exports = router;
