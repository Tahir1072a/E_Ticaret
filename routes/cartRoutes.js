import express from "express";
import {
  addItemToCart,
  getCart,
  modifyCartQuantity,
  removeItemFromCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);

router.post("/", addItemToCart);

router.post("/modify-quantity", modifyCartQuantity);

router.delete("/items/:productId", removeItemFromCart);

export default router;
