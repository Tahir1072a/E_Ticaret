import express from "express";
import { authorize, protect } from "../middleware/authmiddleware.js";
import {
  createUser,
  deleteUser,
  getAllSeller,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUser,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect, authorize("Admin"));

router.post("/", createUser);

router.get("/", getAllUsers);

router.get("/email/:email", getUserByEmail);

router.get("/sellers", getAllSeller);

router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

export default router;
