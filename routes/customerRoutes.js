import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  getAllAdresses,
  getAllSeller,
  deleteCustomer,
  updateCustomer,
  getCustomerOrders,
  getCustomerOrderById,
  openPackage,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  addCustomerAddress,
  deleteCustomerAddress,
  deleteMultipleCustomerAddresses,
  updateCustomerAddress,
  getCustomerAddressById,
  getAllCoupons,
} from "../controllers/customerController.js";
import { createReview } from "../controllers/reviewController.js";
import { createReturnRequest } from "../controllers/orderControllers.js";
import { getMyReturnRequests } from "../controllers/returnRequestController.js";

const router = express.Router();

router.use(protect);

router.get("/coupons", getAllCoupons);

router.get("/sellers", getAllSeller);
router.put("/update", updateCustomer);
router.post("/open-package", openPackage);
router.delete("/", deleteCustomer);

router.get("/addresses", getAllAdresses);
router.get("/addresses/:id", getCustomerAddressById);
router.post("/addresses", addCustomerAddress);
router.delete("/addresses/one/:id", deleteCustomerAddress);
router.delete("/addresses/multiple/:ids", deleteMultipleCustomerAddresses);
router.put("/addresses/update/:id", updateCustomerAddress);

router.get("/orders", getCustomerOrders);
router.get("/orders/id/:id", getCustomerOrderById);
router.get("/orders/return-request", getMyReturnRequests);
router.post("/orders/return-request", createReturnRequest);

router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);

router.delete("/wishlist/:productId", removeFromWishlist);
router.post("/:productId/reviews", protect, createReview);

export default router;
