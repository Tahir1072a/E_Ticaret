import ReturnRequest from "../models/returnRequestModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { StoreProduct } from "../models/storeProductModel.js";

export const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, productId, reason, customerComments } = req.body;

  const order = await Order.findById(orderId).populate({
    path: "orderItems.product",
    select: "seller",
  });

  if (!order) {
    res.status(404);
    throw new Error("Sipariş bulunamadı.");
  }

  if (!order.isDelivered || !order.deliveredAt) {
    return res
      .status(400)
      .json({ message: "Bu sipariş henüz teslim edilmemiş." });
  }

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  if (order.deliveredAt < fifteenDaysAgo) {
    res.status(400);
    throw new Error("Yasal iade süresi (15 gün) dolmuştur.");
  }

  const { product } = order.orderItems.find(function (oi) {
    return oi.product._id.toString() === productId;
  });

  if (!product) {
    return res.status(404).json({
      message:
        "İlgili siparişinizde iade etmek istediğiniz ürün bulunmamaktadır",
    });
  }

  const newReturnRequest = await ReturnRequest.create({
    seller: product.seller,
    user: req.user._id,
    order: orderId,
    product: product._id,
    reason: reason,
    customerComments: customerComments,
  });

  res.status(201).json({
    message: "İade talebiniz başarıyla oluşturulmuştur",
    data: newReturnRequest,
  });
});

export const getMyReturnRequests = asyncHandler(async (req, res) => {
  const myRequests = await ReturnRequest.find({ user: req.user._id })
    .populate("seller", "storeName")
    .sort({ createdAt: -1 });

  res.status(200).json(myRequests);
});

export const getSellerReturnRequests = asyncHandler(async (req, res) => {
  const sellerRequests = await ReturnRequest.find({ seller: req.user._id })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json(sellerRequests);
});

export const updateReturnBySeller = asyncHandler(async (req, res) => {
  const { status, sellerComments } = req.body;

  const request = await ReturnRequest.findById(req.params.id).populate({
    path: "order",
    populate: {
      path: "orderItems",
      select: "quantity",
    },
  });

  if (!request) {
    res.status(404);
    throw new Error("İade talebi bulunamadı.");
  }

  const allowedStatusUpdates = ["APPROVED", "REJECTED"];

  if (!allowedStatusUpdates.includes(status)) {
    res.status(400);
    throw new Error(
      `Geçersiz durum: ${status}. Satıcılar sadece onay veya red durumlarını ayarlayabilir.`
    );
  }

  request.status = status;
  if (sellerComments) request.sellerComments = sellerComments;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (status === "APPROVED") {
      const { quantity } = request.order.orderItems.find((oi) => {
        return oi.product.toString() === request.product.toString();
      });

      await StoreProduct.findByIdAndUpdate(
        request.product,
        {
          $inc: { stock: Number(quantity) },
        },
        { session }
      );
    }
    const updatedRequest = await request.save({ session });
    await session.commitTransaction();

    res.status(200).json(updatedRequest);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// -------------------------------------------------------------------
// --- Admin Fonksiyonları ---
// -------------------------------------------------------------------

export const getAllReturnRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.sellerId) filter.seller = req.query.sellerId;

  const allRequests = await ReturnRequest.find(filter)
    .populate("user", "name email")
    .populate("seller", "name storeName")
    .sort({ createdAt: -1 });

  res.status(200).json(allRequests);
});
