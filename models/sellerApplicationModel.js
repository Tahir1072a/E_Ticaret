import mongoose from "mongoose";

const sellerApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    storeName: {
      type: String,
      required: [true, "Lütfen bir mağaza adını giriniz"],
      unique: true,
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const SellerApplication = mongoose.model(
  "SellerApplication",
  sellerApplicationSchema
);

export default SellerApplication;
