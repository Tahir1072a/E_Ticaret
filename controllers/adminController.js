import Order from "../models/orderModel.js";
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

// Siparişlerin teslim edilip edilmediğini burada onaylayacağız.

export const updateOrderDeliveryAndPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !["yes", "no"].includes(String(status).toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Lütfen yes ya da no gönderiniz!" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .josn({ message: "Bu ordera ait bir kayıt bulunamadı!" });
    }

    if (String(status).toLowerCase === "yes") {
      order.isDelivered = true;
      order.isPaid = true;

      order.paidAt = new Date();
      order.deliveredAt = new Date();
    } else {
      order.isDelivered = false;
      order.isDelivered = true;

      order.isCanceled = false;
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      message: "Teslim tarihi ve ödeme işlemi başarıyla güncellenmiştir",
      data: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
