import express from "express";
import {
  getAllApplications,
  updateApplicationStatus,
  deleteApplicationById,
  getApplicationsByStatus,
} from "../controllers/sellerApplicationController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";
import {
  updateMyProfile,
  updateOrderDeliveryAndPaid,
} from "../controllers/adminController.js";
import {
  getOrdersByRole,
  getOrdersByUserId,
  getOrdersByUserName,
  getAllOrders,
} from "../controllers/orderControllers.js";
import { getAllReturnRequests } from "../controllers/returnRequestController.js";

const router = express.Router();

router.use(protect, authorize("Admin"));

router.get("/seller-applications/:status/status", getApplicationsByStatus);
router.get("/seller-applications/all", getAllApplications);
router.put("/seller-applications/:id/status", updateApplicationStatus);
router.delete("/seller-applications/:id", deleteApplicationById);

router.get("/orders/all", getAllOrders);
router.get("/orders/id/:id", getOrdersByUserId);
router.get("/orders/role/:role", getOrdersByRole);
router.get("/orders/username/:username", getOrdersByUserName);
router.get("/orders/return-request/all", getAllReturnRequests);
router.post("/orders/update/delivery/:orderId", updateOrderDeliveryAndPaid);

router.put("/me", updateMyProfile);

export default router;
