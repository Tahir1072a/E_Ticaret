import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";
import {
  indexDocument,
  deleteDocument,
  BASEPRODUCT_INDEX,
  STOREPRODUCT_INDEX,
  esClient,
} from "../services/elasticSearchServices.js";
import { StoreProduct } from "./storeProductModel.js";

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
  masterImage: {
    type: String,
  },
});

baseProductSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

baseProductSchema.post("save", async function (doc) {
  await indexDocument(BASEPRODUCT_INDEX, doc._id.toString(), doc.toObject());
});

baseProductSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  await deleteDocument(BASEPRODUCT_INDEX, doc._id.toString());
  console.log(`BaseProduct (${doc._id}) kendi index'inden silindi.`);

  const relatedStoreProducts = await StoreProduct.find({
    baseProduct: doc._id,
  });

  if (relatedStoreProducts.length === 0) {
    console.log("İlişkili StoreProduct bulunamadı");
    return;
  }

  const bulkDeleteBody = relatedStoreProducts.flatMap((sp_doc) => [
    { delete: { _index: STOREPRODUCT_INDEX, _id: sp_doc._id.toString() } },
  ]);

  try {
    await esClient.bulk({ refresh: true, body: bulkDeleteBody });
    console.log(
      `${relatedStoreProducts.length} adet ilişkili StoreProduct Elasticsearch'ten başarıyla silindi.`
    );
  } catch (err) {
    console.error(
      "İlişkili StoreProduct'lar için ES'ten toplu silme hatası:",
      err
    );
  }
});

baseProductSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;

  await indexDocument(BASEPRODUCT_INDEX, doc._id.toString(), doc.toObject());

  const updatePayload = this.getUpdate();
  const updateFields = Object.keys(updatePayload.$set || {});
  const fieldsRequiringCascade = ["masterName", "masterCategoryName"];
  const needsCascade = updateFields.some((field) =>
    fieldsRequiringCascade.includes(field)
  );

  if (!needsCascade) {
    console.log("Değişiklikler yayılma gerektirimiyor.");
    return;
  }

  const relatedStoreProducts = await StoreProduct.find({
    baseProduct: doc._id,
  }).populate("seller");

  if (relatedStoreProducts.length === 0) return;

  const body = relatedStoreProducts.flatMap((sp_doc) => {
    const denormalized_body = {
      description: sp_doc.description,
      currentPrice: sp_doc.currentPrice,
      stock: sp_doc.stock,
      rating: sp_doc.rating,
      createdAt: sp_doc.createdAt,

      masterName: doc.masterName, // GÜNCELLENMİŞ VERİ
      masterCategoryName: doc.masterCategoryName, // GÜNCELLENMİŞ VERİ
      masterImage: doc.masterImage, // GÜNCELLENMİŞ VERİ

      sellerName: sp_doc.seller?.storeName,
    };

    return [
      { update: { _index: STOREPRODUCT_INDEX, _id: sp_doc._id.toString() } },
      { doc: denormalized_body },
    ];
  });

  try {
    await esClient.bulk({ refresh: true, body });
    console.log(
      `${relatedStoreProducts.length} ilişkili StoreProduct başarıyla güncellendi.`
    );
  } catch (err) {
    console.error(
      "İlişkili StoreProduct'lar için bulk güncelleme hatası:",
      err
    );
  }
});

export const BaseProduct = mongoose.model("Base Product", baseProductSchema);
