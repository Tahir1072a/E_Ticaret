import express from "express";
import {
  getPendingApplications,
  getAllApplications,
  updateApplicationStatus,
  deleteApplicationById,
} from "../controllers/sellerApplicationController.js";
import { protect, authorize } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect, authorize("Admin"));

router.get("/seller-applications/pending", getPendingApplications);

router.get("/seller-applications/all", getAllApplications);

router.put("/seller-applications/:id/status", updateApplicationStatus);

router.delete("/seller-applications/:id", deleteApplicationById);

export default router;
