import mongoose from "mongoose";
import { addressSchema } from "./commonSchemas.js";
import { Client } from "@elastic/elasticsearch";
import { cartItemSchema } from "./cartModel.js";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [cartItemSchema],
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
    isCanceled: {
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

const Order = mongoose.model("Order", orderSchema);

export default Order;
