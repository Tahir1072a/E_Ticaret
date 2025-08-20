import express from "express";
import {
  changePassword,
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  sellerRegister,
} from "../controllers/authController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/seller-register", sellerRegister);

router.patch("/change-password", protect, changePassword);

router.post("/forgot-password", forgotPassword);

router.patch("/reset-password/:token", resetPassword);

export default router;
