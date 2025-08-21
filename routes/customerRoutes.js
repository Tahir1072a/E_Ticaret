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
} from "../controllers/customerController.js";

const router = express.Router();

router.use(protect);

router.delete("/", deleteCustomer);
router.put("/update", updateCustomer);
router.post("/open-package", openPackage);
router.get("/sellers", getAllSeller);
router.get("/adresses", getAllAdresses);
router.get("/orders", getCustomerOrders);
router.get("/orders/:id", getCustomerOrderById);
router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);
router.post("/:productId/reviews", protect, createReview);

export default router;
