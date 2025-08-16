import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";

const storeProductSchema = new mongoose.Schema({
  baseProduct: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Base Product",
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Seller",
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  priceHistory: [priceHistoryEntrySchema],
  stock: {
    type: Number,
    required: true,
    default: 1,
  },
  description: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
  imgUrl: {
    type: String,
  },
});

// Query middleware
storeProductSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

export const StoreProduct = mongoose.model("StoreProduct", storeProductSchema);
