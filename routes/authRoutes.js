import express from "express";
import {
  loginUser,
  registerUser,
  sellerRegister,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/seller-register", sellerRegister);

export default router;
