const express = require('express');
const router = express.Router();
const catalogueController = require('./catalogue.controller');
const catalogueValidator = require('./catalogue.validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// ─── Public: Products ────────────────────────────────────────────────────────
router.get('/products', catalogueController.listProducts);
router.get('/products/:productId', catalogueController.getProduct);
router.get('/products/:productId/skus', catalogueController.listSkus);
router.get('/products/:productId/skus/:skuId', catalogueController.getSku);
router.get('/products/:productId/images', catalogueController.listProductImages);

// ─── Public: Categories ──────────────────────────────────────────────────────
router.get('/categories', catalogueController.listCategories);
router.get('/categories/:categoryId', catalogueController.getCategory);
router.get('/categories/:categoryId/products', catalogueController.listProductsByCategory);

// ─── Public: Brands ───────────────────────────────────────────────────────────
router.get('/brands', catalogueController.listBrands);
router.get('/brands/:brandId', catalogueController.getBrand);

// ─── Admin: Products ─────────────────────────────────────────────────────────
router.post(
  '/products',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.createProduct),
  catalogueController.createProduct
);

router.put(
  '/products/:productId',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.updateProduct),
  catalogueController.updateProduct
);

router.delete(
  '/products/:productId',
  authenticate,
  authorize('admin'),
  catalogueController.deleteProduct
);

// ─── Admin: SKUs ──────────────────────────────────────────────────────────────
router.post(
  '/products/:productId/skus',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.createSku),
  catalogueController.createSku
);

router.put(
  '/products/:productId/skus/:skuId',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.updateSku),
  catalogueController.updateSku
);

router.delete(
  '/products/:productId/skus/:skuId',
  authenticate,
  authorize('admin'),
  catalogueController.deleteSku
);

// ─── Admin: Product Images ────────────────────────────────────────────────────
router.post(
  '/products/:productId/images',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.addProductImage),
  catalogueController.addProductImage
);

router.delete(
  '/products/:productId/images/:imageId',
  authenticate,
  authorize('admin'),
  catalogueController.deleteProductImage
);

// ─── Admin: Categories ────────────────────────────────────────────────────────
router.post(
  '/categories',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.createCategory),
  catalogueController.createCategory
);

router.put(
  '/categories/:categoryId',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.updateCategory),
  catalogueController.updateCategory
);

router.delete(
  '/categories/:categoryId',
  authenticate,
  authorize('admin'),
  catalogueController.deleteCategory
);

// ─── Admin: Brands ────────────────────────────────────────────────────────────
router.post(
  '/brands',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.createBrand),
  catalogueController.createBrand
);

router.put(
  '/brands/:brandId',
  authenticate,
  authorize('admin'),
  validate(catalogueValidator.updateBrand),
  catalogueController.updateBrand
);

router.delete(
  '/brands/:brandId',
  authenticate,
  authorize('admin'),
  catalogueController.deleteBrand
);

module.exports = router;
