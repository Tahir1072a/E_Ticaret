import express from "express";
import {
  searchProducts,
  searchStoreProducts,
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/base-products", searchProducts);
router.get("/store-products", searchStoreProducts);

export default router;
