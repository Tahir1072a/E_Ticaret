import express from "express";
import { authorize, protect } from "../middleware/authmiddleware.js";
import {
  createStoreProduct,
  deleteStoreProduct,
  getAllStoreProduct,
  getProductBySellerId,
  getStoreProductById,
  getStoreProductByName,
  updateStock,
  updateStoreProduct,
} from "../controllers/storeProductController.js";

const router = express.Router();

router.use(protect, authorize("Admin", "Seller"));

router.post("/", createStoreProduct);

router.put("/:id", updateStoreProduct);

router.get("/", getAllStoreProduct);

router.delete("/:id", deleteStoreProduct);

router.get("/:id", getStoreProductById);

router.get("/name/:name", getStoreProductByName);

router.patch("/stock/:id", updateStock);

router.get("/seller-products", getProductBySellerId);

export default router;
