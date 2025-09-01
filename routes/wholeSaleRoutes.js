import express from "express";
import {
  createBaseProduct,
  getAllBaseProduct,
  getBaseProductById,
  getBaseProductByName,
  updateBaseProductById,
  importFromExternalAPI,
  uploadBaseProductImage,
} from "../controllers/baseProductController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.use(protect);

router.get("/import", importFromExternalAPI);

router.post("/", authorize("Admin"), createBaseProduct);

router.get("/", authorize("Seller", "Admin"), getAllBaseProduct);

router.delete("/", authorize("Admin"), getAllBaseProduct);

router.get("/name/:name", authorize("Seller", "Admin"), getBaseProductByName);

router.put("/:id", authorize("Admin"), updateBaseProductById);

router.get("/:id", authorize("Seller", "Admin"), getBaseProductById);

router.put(
  "/:id/image",
  authorize("Admin"),
  upload.single("productImage"),
  uploadBaseProductImage
);

export default router;
