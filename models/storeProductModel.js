import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";
import mongoosastic from "mongoosastic";

const storeProductSchema = new mongoose.Schema(
  {
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
    onSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Query middleware
storeProductSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

storeProductSchema.plugin(mongoosastic, {
  es_host: "localhost",
  es_port: 9200,

  populate: [
    { path: "baseProduct", select: "masterName masterCategoryName" },
    { path: "seller", select: "storeName" },
  ],
});

export const StoreProduct = mongoose.model("StoreProduct", storeProductSchema);
