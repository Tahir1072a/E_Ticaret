import mongoose from "mongoose";

export const priceHistoryEntrySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { _id: false }
);

export const addressSchema = new mongoose.Schema({
  address: { type: String },
  city: { type: String },
  country: { type: String },
  addressType: {
    type: String,
    enum: ["Ev Adresi", "İş Adresi", "Diğer"],
    default: "Ev Adresi",
  },
});
