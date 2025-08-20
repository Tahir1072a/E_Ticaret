import express from "express";
import {
  changePassword,
  loginUser,
  registerUser,
  sellerRegister,
} from "../controllers/authController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/seller-register", sellerRegister);

router.patch("/change-password", protect, changePassword);

export default router;
