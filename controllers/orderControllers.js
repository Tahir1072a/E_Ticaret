import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import mongoose from "mongoose";
import { StoreProduct } from "../models/storeProductModel.js";
import Coupon from "../models/couponModel.js";
import CouponUsage from "../models/couponUsedModel.js";
import { User } from "../models/usersModel.js";
import ReturnRequest from "../models/returnRequestModel.js";

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
            "Teslimat adresi zorunludur. Lütfen teslimat için bir adres giriniz.",
        });
      }
    }

    const cart = await Cart.findOne({ user: userId }).lean();
    if (!cart || cart.items.length == 0) {
      return res.status(404).json({
        message:
          "Sipariş vermek için lütfen öncelikle sepete bir ürün ekleyiniz.",
      });
    }

    const order = new Order({
      user: userId,
      orderItems: cart.items,
      shippingAddress: finalShippingAdress,
      paymentMethod,
      totalPrice: cart.total,
      appliedCoupon: cart.appliedCoupon,
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

export const deleteOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!orderId)
      return res.status(400).json({
        message: "Lütfen cancel edilen order'ın id değerini gönderiniz.",
      });

    const canceledOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        isCanceled: true,
      },
      { new: true }
    );

    if (!canceledOrder) {
      return res
        .status(404)
        .json({ message: "Silmek istediğiniz sipariş bulunamamıştır" });
    }

    return res.status(200).json({
      message: "İlgili order başarıyla güncellendi",
      data: canceledOrder,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const confirmPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user._id;
    const order = await Order.findOne({ _id: id, user: userId }).session(
      session
    );

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Böyle bir sipariş bulunamadı" });
    }
    if (order.isPaid) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Bu sipariş zaten ödenmiş" });
    }

    if (order.appliedCoupon) {
      const coupon = await Coupon.findOne({
        code: order.appliedCoupon,
      }).session(session);

      if (!coupon) {
        throw new Error(`Kupon kodu bulunamadı: ${order.appliedCoupon}`);
      }

      if (coupon.timesUsed + 1 === coupon.usageLimit) {
        coupon.isActive = false;
      }

      coupon.timesUsed += 1;
      await coupon.save({ session });

      await CouponUsage.create(
        [
          {
            coupon: coupon._id,
            user: userId,
            order: order._id,
          },
        ],
        { session }
      );
    }

    for (const item of order.orderItems) {
      await StoreProduct.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // order.isPaid = True
    //

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { isPaid: true, paidAt: new Date() },
      { new: true, session: session }
    );

    await Cart.findOneAndDelete({ user: userId }).session(session);
    await session.commitTransaction();

    res.status(200).json({
      message: "Sipariş ödemesi başarıyla gerçekleşmiştir.",
      data: updatedOrder,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
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
      user: sellerId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ messsage: err.message });
  }
};

export const getOrdersByUserId = async (req, res) => {
  try {
    const { id: userId } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Lütfen düzgün bir kullanıcı id değeri giriniz" });
    }

    const user = await User.findById(id).lean();

    if (!user) {
      res.status(404).json({
        message: `Sisteme kayıtlı bu ID sahip bir kullanıcı bulunamadı. ID: ${userId}`,
      });
    }

    const orders = await Order.find({ user: userId }).populate("user");

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrdersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!role) {
      return res.status(400).json({ message: "Rol parametresi zorunludur." });
    }

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $match: {
          "userDetails.role": role,
        },
      },
      {
        $project: {
          user: "$userDetails",

          orderItems: 1,
          shippingAddress: 1,
          paymentMethod: 1,
          totalPrice: 1,
          isPaid: 1,
          paidAt: 1,
          isDelivered: 1,
          isCanceled: 1,
          appliedCoupon: 1,
          deliveredAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrdersByUserName = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(404).json({ message: "UserName alanı zorunludur" });
    }

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $match: {
          "userDetails.username": username,
        },
      },
      {
        $project: {
          user: "$userDetails",

          orderItems: 1,
          shippingAddress: 1,
          paymentMethod: 1,
          totalPrice: 1,
          isPaid: 1,
          paidAt: 1,
          isDelivered: 1,
          isCanceled: 1,
          appliedCoupon: 1,
          deliveredAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user");

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
