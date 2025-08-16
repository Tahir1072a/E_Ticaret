import { Seller, User } from "../models/usersModel.js";
import Order from "../models/orderModel.js";

export const getAllSeller = async (req, res) => {
  try {
    const sellers = await Seller.find({}).select("name storeName").lean();

    res.status(200).json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const id = req.user._id;

    await User.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({ message: "Kullanıcı hesabı başarıyla silinmiştir" });
  } catch (err) {
    res.status(500).json({ message: message });
  }
};

export const getAllAdresses = async (req, res) => {
  try {
    const id = req.user.id;

    const addresses = await User.findById(id).select("shippingAddresses");

    if (addresses.length === 0) {
      return res
        .status(404)
        .json({ message: "Kayıtlı adresiniz bulunamamıştır" });
    }

    res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const id = req.user._id;
    const { shippingAddresses, ...customerData } = req.body;

    const customerPayload = { $set: customerData };
    if (shippingAddress && shippingAddress.address) {
      customerPayload.$push = {
        shippingAddresses: {
          ...shippingAddresses,
        },
      };
    }

    const updatedCustomer = await User.findOneAndUpdate(id, customerPayload, {
      new: true,
    }).lean();

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      message: "Customer başarıyla güncellendi",
      data: updatedCustomer,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const id = req.user._id;

    const orders = await Order.find({ user: id })
      .select("orderItems")
      .populate("user", "email name")
      .populate("seller", "email name");

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: message });
  }
};

export const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const orderDetail = await Order.findOne({ _id: id, user: userId })
      .populate("user")
      .populate("seller")
      .populate({
        path: "orderItems.product",
      });

    if (!orderDetail) {
      return res
        .status(404)
        .json({ message: "Bu id'ye ait bir ürün bulunamamıştır!" });
    }

    res.status(200).json(orderDetail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
