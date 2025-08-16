import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  getAllAdresses,
  getAllSeller,
  deleteCustomer,
  updateCustomer,
  getCustomerOrders,
  getCustomerOrderById,
} from "../controllers/customerController.js";

const router = express.Router();

router.use(protect);

router.delete("/", deleteCustomer);
router.put("/update", updateCustomer);
router.get("/sellers", getAllSeller);
router.get("/adresses", getAllAdresses);
router.get("/orders", getCustomerOrders);
router.get("/orders/:id", getCustomerOrderById);

export default router;
