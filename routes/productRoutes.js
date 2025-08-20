import express from "express";
import {
  getAllPublicProducts,
  getPublicProductById,
  getPublicProductByCategory,
  getPublicProductsByStoreName,
} from "../controllers/productControllerCatalog.js";
import {
  createReview,
  getReviewsForProduct,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", getAllPublicProducts);
router.get("/category/:category", getPublicProductByCategory);
router.get("/store-name/:storeName", getPublicProductsByStoreName);
router.get("/:id", getPublicProductById);
router.get("/:productId/reviews", getReviewsForProduct);
router.post("/:productId/reviews", protect, createReview);

export default router;
