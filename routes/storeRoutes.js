import express from "express";
import { authorize, protect } from "../middleware/authmiddleware";
import {
  getSellerOrders,
  getSellerOrdersByProductId,
} from "../controllers/orderControllers";

const router = express.Routes();

router.use(protect, authorize("Seller"));
router.get("/orders", getSellerOrders);
router.get("/orders/:id", getSellerOrdersByProductId);

export default router;
