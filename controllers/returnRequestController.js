import ReturnRequest from "../models/returnRequestModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

export const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, itemsToReturn, reason, customerComments } = req.body;

  const order = await Order.findById(orderId).populate({
    path: "orderItems.product",
    select: "seller",
  });

  if (!order) {
    res.status(404);
    throw new Error("Sipariş bulunamadı.");
  }

  if (!order.isDelivered || !order.deliveredAt) {
    res.status(400);
    throw new Error("Bu sipariş henüz teslim edilmemiş.");
  }

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  if (order.deliveredAt < fifteenDaysAgo) {
    res.status(400);
    throw new Error("Yasal iade süresi (15 gün) dolmuştur.");
  }

  const sellerGroupedItems = {};

  for (const item of itemsToReturn) {
    const orderItem = order.orderItems.find(
      (oi) => oi._id.toString() === item.orderItemId
    );

    if (!orderItem) {
      res.status(400);
      throw new Error(`Siparişte ${item.orderItemId} ID'li ürün bulunamadı.`);
    }

    const sellerId = orderItem.product.seller.toString();

    if (!sellerGroupedItems[sellerId]) {
      sellerGroupedItems[sellerId] = [];
    }
    sellerGroupedItems[sellerId].push(item);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const creationPromises = [];

    for (const sellerId in sellerGroupedItems) {
      const itemsForThisSeller = sellerGroupedItems[sellerId];

      const currentRequestItemIds = itemsForThisSeller.map(
        (item) => item.orderItemId
      );

      const existingRequest = await ReturnRequest.findOne({
        order: orderId,
        seller: sellerId,
        status: { $nin: ["REJECTED", "APPROVED"] },
        "returnedItems.orderItem": { $in: currentRequestItemIds },
      });

      if (existingRequest) {
        continue;
      }

      const newReturnRequest = new ReturnRequest({
        user: req.user.id,
        order: orderId,
        seller: sellerId,
        returnedItems: itemsForThisSeller,
        reason: reason,
        customerComments: customerComments,
      });

      creationPromises.push(newReturnRequest.save({ session }));
    }

    if (creationPromises.length === 0) {
      res.status(400);
      throw new Error(
        "Oluşturulacak geçerli bir iade talebi bulunamadı. Talepleriniz zaten işleme alınmış olabilir."
      );
    }

    await session.commitTransaction();

    const createdRequests = await Promise.all(creationPromises);
    res.status(201).json({
      message: "İade talepleriniz başarıyla oluşturuldu.",
      createdRequests,
    });
  } catch (err) {
    await session.abortTransaction();

    res.status(400);
    throw new Error(`İade talebi oluşturulamadı: ${err.message}`);
  } finally {
    session.endSession();
  }
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

  const request = await ReturnRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error("İade talebi bulunamadı.");
  }

  const allowedStatusUpdates = ["APPROVED", "REJECTED"];

  if (!allowedStatusUpdates.includes(status)) {
    res.status(400);
    throw new Error(
      `Geçersiz durum: ${status}. Satıcılar sadece onay ceya red durumlarını ayarlayabilir.`
    );
  }

  request.status = status;
  if (sellerComments) request.sellerComments = sellerComments;

  const updatedRequest = await request.save();
  res.status(200).json(updatedRequest);
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
