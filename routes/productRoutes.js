import express from "express";
import {
  getAllPublicProducts,
  getPublicProductById,
  getPublicProductByCategory,
  getPublicProductsByStoreName,
} from "../controllers/productControllerCatalog.js";
import { getReviewsForProduct } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getAllPublicProducts);
router.get("/category/:category", getPublicProductByCategory);
router.get("/store-name/:storeName", getPublicProductsByStoreName);
router.get("/:id", getPublicProductById);
router.get("/:productId/reviews", getReviewsForProduct);

export default router;
