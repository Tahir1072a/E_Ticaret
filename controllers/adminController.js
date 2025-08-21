import { Admin } from "../models/usersModel.js";
import { createHash } from "./userController.js";

export const updateMyProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { password, ...otherData } = req.body;

    // Admin kendi rolünü güncelleyemez.
    if (otherData.role) {
      delete otherData.role;
    }

    const updatePayload = { $set: otherData };

    if (password) {
      updatePayload.$set.password = await createHash(password);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updatePayload, {
      new: true,
    }).lean();

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin profili bulunamadı" });
    }

    res.status(200).json({
      message: "Profiliniz başarıyla güncellendi",
      data: updatedAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
