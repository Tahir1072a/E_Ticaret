import express from "express";
import { authorize, protect } from "../middleware/authmiddleware";
import {
  getSellerOrders,
  getSellerOrdersByProductId,
} from "../controllers/orderControllers.js";
import { startSale, stopSale } from "../controllers/storeProductController";

const router = express.Routes();

router.use(protect, authorize("Seller"));
router.get("/orders", getSellerOrders);
router.get("/orders/:id", getSellerOrdersByProductId);

router.put("/products/:id/sale/start", startSale);
router.put("/products/:id/sale/stop", stopSale);

export default router;
