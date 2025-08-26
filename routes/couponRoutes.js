import express from "express";
import {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  getCouponsByType,
  getCouponsByCodeName,
  updateCouponValue,
  deleteCoupon,
  removeCouponFromCart,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllCoupons, authorize("Admin"));

router.get("/type/:type", getCouponsByType, authorize("Admin"));

router.get("/code/:code", getCouponsByCodeName, authorize("Admin"));

router.post("/", createCoupon, authorize("Admin"));

router.post("/apply-coupon", applyCoupon);

router.put("/:id", updateCouponValue, authorize("Admin"));

router.delete("/:id", deleteCoupon, authorize("Admin"));

router.delete("/cart/:id", removeCouponFromCart);

export default router;
