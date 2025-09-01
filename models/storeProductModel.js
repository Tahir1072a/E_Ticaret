import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";
import {
  indexDocument,
  deleteDocument,
  STOREPRODUCT_INDEX,
} from "../services/elasticSearchServices.js";

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

const syncStoreProductToES = async (docId) => {
  try {
    const docToSync = await StoreProduct.findById(docId)
      .populate("baseProduct", "masterName masterCategoryName")
      .populate("seller", "storeName");

    if (!docToSync || !docToSync.isActive) {
      await deleteDocument(STOREPRODUCT_INDEX, docId.toString());
      return;
    }

    const denormalizedBody = {
      description: docToSync.description,
      currentPrice: docToSync.currentPrice,
      stock: docToSync.stock,
      rating: docToSync.rating,
      createdAt: docToSync.createdAt,

      baseName: docToSync.baseProduct?.masterName,
      baseCategoryName: docToSync.baseProduct?.masterCategoryName,

      sellerName: docToSync.seller?.storeName,
    };

    await indexDocument(
      STOREPRODUCT_INDEX,
      docToSync._id.toString(),
      denormalizedBody
    );
  } catch (err) {
    console.error(`StoreProduct senkronizasyon hatası (${docId}):`, err);
  }
};

storeProductSchema.post("save", function (doc) {
  syncStoreProductToES(doc._id);
});

storeProductSchema.post("findOneAndUpdate", function (doc) {
  if (doc) {
    syncStoreProductToES(doc._id);
  }
});

storeProductSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    deleteDocument(STOREPRODUCT_INDEX, doc._id.toString());
  }
});

export const StoreProduct = mongoose.model("StoreProduct", storeProductSchema);
