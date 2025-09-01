import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "Yorum alanı boş bırakılmaz!"],
    },
    rating: {
      type: Number,
      required: [true, "Lütfen 1-5 arasında bir değer giriniz"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "StoreProduct",
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
