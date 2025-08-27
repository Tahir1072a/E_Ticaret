import express from "express";
import { authorize, protect } from "../middleware/authmiddleware.js";
import {
  getSellerOrders,
  getSellerOrdersByProductId,
} from "../controllers/orderControllers.js";
import {
  startSale,
  stopSale,
  applySaleAllProducts,
  removeSaleAllProducts,
} from "../controllers/storeController.js";
import {
  getSellerReturnRequests,
  updateReturnBySeller,
} from "../controllers/returnRequestController.js";

const router = express.Router();

router.use(protect, authorize("Admin", "Seller"));

router.get("/orders", getSellerOrders);
router.get("/orders/id/:id", getSellerOrdersByProductId);
router.get("/orders/return-requests", getSellerReturnRequests);
router.put("/orders/return-requests/:id", updateReturnBySeller);

router.post("/products/sale/start-all", applySaleAllProducts);
router.post("/products/sale/stop-all", removeSaleAllProducts);

router.put("/products/:id/sale/start", startSale);
router.put("/products/:id/sale/stop", stopSale);

export default router;
