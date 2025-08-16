import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import mongoose from "mongoose";
import { StoreProduct } from "../models/storeProductModel.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body;

    let finalShippingAdress = req.body.shippingAddress;

    if (!finalShippingAdress) {
      if (req.user.shippingAddress && req.user.shippingAddress.address) {
        finalShippingAdress = req.user.shippingAddress;
      } else {
        return res.status(404).json({
          message:
            "Teslimat adresi zorunlduur. Lütfen teslimat için bir adres giriniz.",
        });
      }
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length == 0) {
      return res.status(404).json({
        message:
          "Sipariş vermek için lütfen öncelikle sepete bir ürün ekleyiniz.",
      });
    }

    const totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    const order = new Order({
      user: userId,
      orderItems: cart.items,
      shippingAddress: finalShippingAdress,
      paymentMethod,
      totalPrice,
      isPaid: false,
    });

    const createdOrder = await order.save();

    res.status(201).json({
      message: "Sipariş başarıyla oluşturulmuştur",
      data: createdOrder,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const confirmPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const order = await Order.findById(id).session(session);

    if (!order) {
      return res.status(404).json({ message: "Böyle bir sipariş bulunamadı" });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: "Bu sipariş zaten ödenmiş" });
    }

    for (const item of order.orederItems) {
      await StoreProduct.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    order.isPaid = true;
    order.paidAt = new Date();
    const updatedOrder = await order.save();

    await Cart.findOneAndDelete({ user: order.user }).session(session);
    await session.commitTransaction();

    res.status(200).json({
      message: "Sipariş ödemesi başarıyla gerçekleşmiştir.",
      data: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user_id;

    const sellerProducts = await StoreProduct.find({ seller: sellerId }).select(
      "_id"
    );
    const sellerProductsIds = sellerProducts.map((p) => p._id);

    if (sellerProductsIds.length === 0) {
      return res.status(200).json({
        message: "Bu satıcıya ait hiçbir ürün bulunmamaktadır",
        data: [],
      });
    }

    const orders = await Order.find({
      "orderItems.product": { $in: sellerProductsIds },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ messsage: err.message });
  }
};

export const getSellerOrdersByProductId = async (req, res) => {
  try {
    const sellerId = req.user_id;
    const { Id } = req.params;

    const orders = await Order.find({
      "orderItems.product": Id,
      seller: sellerId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ messsage: err.message });
  }
};
