import { Router } from "express";
import { upload } from "../utils/storage";
import sessionCheck from "../middlewares/sessions.middleware";
import { PaginationValidator } from "../validators/request.validator";
import { ProductsController } from "../controllers/products.controller";
import perMissionMiddleware from "../middlewares/permission.middleware";
import {
  ProductCreationValidator,
  ProductIdValidator,
} from "../validators/products.validator";

// init router
const router = Router();

// instance controller
const controller = new ProductsController();

/**
 * Create products
 */
router.post(
  "/",
  sessionCheck,
  perMissionMiddleware("create-products"),
  ProductCreationValidator,
  controller.createProducts
);

/**
 * Get products
 */
router.get(
  "/",
  sessionCheck,
  perMissionMiddleware("list-products"),
  PaginationValidator,
  controller.getProducts
);

/**
 * Upload files products
 */
const uploadFields = upload.fields([
  { name: "bannerMobile", maxCount: 1 },
  { name: "bannerDesktop", maxCount: 1 },
  { name: "imagesMobile", maxCount: 5 },
  { name: "imagesDesktop", maxCount: 5 },
]);
router.post(
  "/upload-files",
  sessionCheck,
  perMissionMiddleware("create-products"),
  uploadFields,
  ProductIdValidator,
  controller.uploadFiles
);

/**
 * Show product
 */
router.get(
  '/:id',
  sessionCheck,
  perMissionMiddleware("list-products"),
  ProductIdValidator,
  controller.showProduct,
);

/**
 * Delete products
 */
router.delete(
  '/:id',
  sessionCheck,
  perMissionMiddleware("delete-products"),
  ProductIdValidator,
  controller.deleteProduct,
);

/**
 * Update products
 */
router.put(
  "/:id",
  sessionCheck,
  perMissionMiddleware("update-products"),
  ProductCreationValidator,
  controller.updateProducts
);

/**
 * Delete product image
 */
router.delete(
  "/:id/delete-image",
  sessionCheck,
  perMissionMiddleware("delete-products"),
  ProductIdValidator,
  controller.deleteProductImage
);

/**
 * Count product
 */
router.get(
  '/count-products/get',
  sessionCheck,
  perMissionMiddleware("list-products"),
  controller.getCountProducts,
);

/**
 * Get products
 */
router.get(
  "/list/from-web",
  PaginationValidator,
  controller.getProducts
);

/**
 * Show products
 */
router.get(
  "/show/from-web/:id",
  ProductIdValidator,
  controller.showProduct
);

// export router
export { router };
