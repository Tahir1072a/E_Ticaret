import mongoose from "mongoose";
import { addressSchema } from "./commonSchemas.js";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: addressSchema,
    paymentMethod: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    appliedCoupon: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

orderSchema.plugin(mongoosastic, {
  es_host: "localhost",
  es_port: 9200,

  populate: [
    {
      path: "user",
      select: "-password -age",
    },
    {
      path: "seller",
      select: "-password -age -sellerId",
    },
    {
      path: "orderItems.product",
      select: "description",
      populate: {
        path: "baseProduct",
        select: "masterName masterCategoryName",
      },
    },
  ],
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
