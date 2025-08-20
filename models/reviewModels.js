import { populate } from "dotenv";
import Mongoosastic from "mongoosastic";
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

reviewSchema.plugin(Mongoosastic, {
  es_host: "localhost",
  es_port: 9200,

  populate: [
    {
      path: "user",
      select: "-password, -age",
    },
    {
      path: "product",
      select: "",
      populate: {
        path: "baseProdcut",
        select: "masterName",
      },
    },
  ],
});

export const Review = mongoose.model("Review", reviewSchema);
