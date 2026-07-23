const express = require('express');
const router = express.Router();
const checkoutController = require('./checkout.controller');
const { validateCheckoutStart, validateCheckoutAddress, validateCheckoutPlaceOrder } = require('./checkout.validator');
const { optionalAuth } = require('../../middleware/optionalAuth');

// Guest checkout is supported via optionalAuth middleware
router.post('/start', optionalAuth, validateCheckoutStart, checkoutController.startCheckout);
router.post('/address', optionalAuth, validateCheckoutAddress, checkoutController.submitAddress);
router.get('/review', optionalAuth, checkoutController.reviewCheckout);
router.post('/place-order', optionalAuth, validateCheckoutPlaceOrder, checkoutController.placeOrder);

// Aliases used in design package
router.post('/initiate', optionalAuth, validateCheckoutStart, checkoutController.startCheckout);
router.post('/confirm', optionalAuth, validateCheckoutPlaceOrder, checkoutController.placeOrder);

module.exports = router;
