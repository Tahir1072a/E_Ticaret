import express from "express";
import { createCoupon } from "../controllers/couponController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin", "seller"));

router.post("/", createCoupon);

export default router;
