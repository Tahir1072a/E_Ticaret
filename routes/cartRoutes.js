import express from "express";
import {
  addItemToCart,
  applyCoupon,
  getCart,
  removeItemFromCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);

router.post("/", addItemToCart);

router.delete("/items/:productId", removeItemFromCart);

router.post("/apply-coupon", applyCoupon);

export default router;
