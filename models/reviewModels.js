import Mongoosastic from "mongoosastic";
import mongoose from "mongoose";
import { Client } from "@elastic/elasticsearch";

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

const esClient = new Client({ node: "http://localhost:9200" });

reviewSchema.post("save", async function (doc) {
  try {
    const populatedDoc = await doc.populate([
      {
        path: "user",
        select: "-password -age",
      },
      {
        path: "product",
        select: "",
        populate: {
          path: "baseProduct",
          select: "masterName",
        },
      },
    ]);

    await esClient.index({
      index: "Review",
      id: populatedDoc._id.toString(),
      body: populatedDoc.toObject(),
    });
  } catch (err) {
    console.error("Error indexing document to Elasticsearch:", err);
  }
});

export const Review = mongoose.model("Review", reviewSchema);
