import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  confirmPayment,
  createOrder,
} from "../controllers/orderControllers.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrder);

router.put("/:id/pay", confirmPayment);

export default router;
