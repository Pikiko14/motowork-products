import { Router } from "express";
import sessionCheck from "../middlewares/sessions.middleware";
import { PaginationValidator } from "../validators/request.validator";
import { ProductsController } from "../controllers/products.controller";
import perMissionMiddleware from "../middlewares/permission.middleware";
import { ProductCreationValidator } from "../validators/products.validator";

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

// export router
export { router };
