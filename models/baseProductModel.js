import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";

const baseProductSchema = new mongoose.Schema({
  masterNumber: {
    type: String,
    required: true,
    unique: true,
  },
  masterName: {
    type: String,
    required: true,
  },
  masterPrice: {
    type: Number,
    required: true,
  },
  masterPriceHistory: [priceHistoryEntrySchema],
  masterDate: {
    type: Date,
  },
  masterCategoryNumber: {
    type: String,
    required: true,
  },
  masterCategoryName: {
    type: String,
    required: true,
  },
  masterStock: {
    type: Number,
    required: true,
    default: 1,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
});

baseProductSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

export const BaseProduct = mongoose.model("Base Product", baseProductSchema);
