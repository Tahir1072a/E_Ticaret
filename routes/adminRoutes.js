import express from "express";
import {
  getAllApplications,
  updateApplicationStatus,
  deleteApplicationById,
  getApplicationsByStatus,
} from "../controllers/sellerApplicationController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";
import { updateMyProfile } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("Admin"));

router.get("/seller-applications/:status", getApplicationsByStatus);

router.get("/seller-applications", getAllApplications);

router.put("/seller-applications/:id/status", updateApplicationStatus);

router.delete("/seller-applications/:id", deleteApplicationById);

router.put("/me", updateMyProfile);

export default router;
