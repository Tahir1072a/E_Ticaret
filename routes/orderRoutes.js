import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  confirmPayment,
  createOrder,
  deleteOrder,
} from "../controllers/orderControllers.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrder);

router.put("/:id/pay", confirmPayment);

router.delete("/:id", deleteOrder);

export default router;
