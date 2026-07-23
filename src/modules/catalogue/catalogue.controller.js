const catalogueService = require('./catalogue.service');
const { HTTP_STATUS } = require('../../constants/httpStatus');

// ─── Products ─────────────────────────────────────────────────────────────────

async function listProducts(req, res, next) {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      brandId: req.query.brandId,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await catalogueService.listProducts(filters);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await catalogueService.getProductById(req.params.productId);
    return res.status(HTTP_STATUS.OK).json(product);
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await catalogueService.createProduct(req.body);
    return res.status(HTTP_STATUS.CREATED).json(product);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await catalogueService.updateProduct(req.params.productId, req.body);
    return res.status(HTTP_STATUS.OK).json(product);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await catalogueService.deleteProduct(req.params.productId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

async function listSkus(req, res, next) {
  try {
    const skus = await catalogueService.listSkus(req.params.productId);
    return res.status(HTTP_STATUS.OK).json(skus);
  } catch (err) {
    next(err);
  }
}

async function getSku(req, res, next) {
  try {
    const sku = await catalogueService.getSkuById(req.params.productId, req.params.skuId);
    return res.status(HTTP_STATUS.OK).json(sku);
  } catch (err) {
    next(err);
  }
}

async function createSku(req, res, next) {
  try {
    const sku = await catalogueService.createSku(req.params.productId, req.body);
    return res.status(HTTP_STATUS.CREATED).json(sku);
  } catch (err) {
    next(err);
  }
}

async function updateSku(req, res, next) {
  try {
    const sku = await catalogueService.updateSku(
      req.params.productId,
      req.params.skuId,
      req.body
    );
    return res.status(HTTP_STATUS.OK).json(sku);
  } catch (err) {
    next(err);
  }
}

async function deleteSku(req, res, next) {
  try {
    await catalogueService.deleteSku(req.params.productId, req.params.skuId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ─── Product Images ───────────────────────────────────────────────────────────

async function listProductImages(req, res, next) {
  try {
    const images = await catalogueService.listProductImages(req.params.productId);
    return res.status(HTTP_STATUS.OK).json(images);
  } catch (err) {
    next(err);
  }
}

async function addProductImage(req, res, next) {
  try {
    const image = await catalogueService.addProductImage(req.params.productId, req.body);
    return res.status(HTTP_STATUS.CREATED).json(image);
  } catch (err) {
    next(err);
  }
}

async function deleteProductImage(req, res, next) {
  try {
    await catalogueService.deleteProductImage(req.params.productId, req.params.imageId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories(req, res, next) {
  try {
    const categories = await catalogueService.listCategories();
    return res.status(HTTP_STATUS.OK).json(categories);
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await catalogueService.getCategoryById(req.params.categoryId);
    return res.status(HTTP_STATUS.OK).json(category);
  } catch (err) {
    next(err);
  }
}

async function listProductsByCategory(req, res, next) {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await catalogueService.listProductsByCategory(req.params.categoryId, filters);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await catalogueService.createCategory(req.body);
    return res.status(HTTP_STATUS.CREATED).json(category);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await catalogueService.updateCategory(req.params.categoryId, req.body);
    return res.status(HTTP_STATUS.OK).json(category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await catalogueService.deleteCategory(req.params.categoryId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ─── Brands ───────────────────────────────────────────────────────────────────

async function listBrands(req, res, next) {
  try {
    const brands = await catalogueService.listBrands();
    return res.status(HTTP_STATUS.OK).json(brands);
  } catch (err) {
    next(err);
  }
}

async function getBrand(req, res, next) {
  try {
    const brand = await catalogueService.getBrandById(req.params.brandId);
    return res.status(HTTP_STATUS.OK).json(brand);
  } catch (err) {
    next(err);
  }
}

async function createBrand(req, res, next) {
  try {
    const brand = await catalogueService.createBrand(req.body);
    return res.status(HTTP_STATUS.CREATED).json(brand);
  } catch (err) {
    next(err);
  }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await catalogueService.updateBrand(req.params.brandId, req.body);
    return res.status(HTTP_STATUS.OK).json(brand);
  } catch (err) {
    next(err);
  }
}

async function deleteBrand(req, res, next) {
  try {
    await catalogueService.deleteBrand(req.params.brandId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // SKUs
  listSkus,
  getSku,
  createSku,
  updateSku,
  deleteSku,
  // Images
  listProductImages,
  addProductImage,
  deleteProductImage,
  // Categories
  listCategories,
  getCategory,
  listProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  // Brands
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
