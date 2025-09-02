import mongoose from "mongoose";
import { StoreProduct } from "../models/storeProductModel.js";

export const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StoreProduct",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  // Ürünün sepete eklendiği andaki fiyatı
  price: {
    type: Number,
    required: true,
  },
  onSale: {
    type: Boolean,
  },
  salePrice: {
    type: Number,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    subTotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    appliedCoupon: {
      type: String,
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", async function (next) {
  let total = 0;

  if (this.items.length > 0) {
    total = this.items.reduce((acc, item) => {
      if (item.onSale) {
        return acc + item.salePrice * item.quantity;
      } else {
        return acc + item.quantity * item.price;
      }
    }, 0);
  }

  this.subTotal = total;

  if (!this.appliedCoupon) {
    this.total = total;
  }

  next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
