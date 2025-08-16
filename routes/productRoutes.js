import express from "express";
import {
  getAllPublicProducts,
  getPublicProductById,
  getPublicProductByCategory,
  getPublicProductsByStoreName,
} from "../controllers/productControllerCatalog.js";

const router = express.Router();

router.get("/", getAllPublicProducts);
router.get("/category/:category", getPublicProductByCategory);
router.get("/store-name/:storeName", getPublicProductsByStoreName);
router.get("/:id", getPublicProductById);

export default router;
