import express from "express";
import {
  searchProducts,
  searchStoreProducts,
  searchUsers,
} from "../controllers/searchController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/base-products", searchProducts);
router.get("/store-products", searchStoreProducts);
router.get("/users", protect, authorize("Admin"), searchUsers);

export default router;
