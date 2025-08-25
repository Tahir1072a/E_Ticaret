import mongoose from "mongoose";

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

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
