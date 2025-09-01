import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";
import { Client } from "@elastic/elasticsearch";
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

const esClient = new Client({ node: "http://localhost:9200" });

const syncWithElasticSearch = async (docId) => {
  try {
    const docToSync = await StoreProduct.findById(docId)
      .populate("seller")
      .populate("baseProduct");

    if (!docToSync) {
      console.error(`Senkronizasyon için döküman bulunamadı: ${docId}`);
      return;
    }

    const body = docToSync.toObject();

    await esClient.index({
      index: "storeproducts",
      id: docToSync._id.toString(),
      body: body,
    });

    console.log(`Doküman ${docId} başarıyla senkronize edildi.`);
  } catch (err) {
    console.error(`Elasticsearch senkronizasyon hatası: (${docId}):`, err);
  }
};

const removeFromElasticSearch = async (docId) => {
  try {
    await esClient.delete({
      index: "storeproducts",
      id: docId.toString(),
    });
    console.log(`Döküman ${docId} indeksten başarıyla silindi`);
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) {
      console.log(`Döküman ${docId} zaten indekste bulunmuyor`);
      return;
    }
    console.error(`Elasticsearch silme hatası (${docId})`, err);
  }
};

storeProductSchema.post("save", async function (doc) {
  console.log("Post-save hook triggered for:", doc._id);
  await syncWithElasticSearch(doc._id);
});

storeProductSchema.post("findOneAndUpdate", async function (doc) {
  console.log("Post-findOneAndUpdate hook triggered for:", doc._id);
  await syncWithElasticSearch(doc._id);
});

storeProductSchema.post("findOneAndDelete", async function (doc) {
  console.log("Post-findOneAndDelete hook triggered for:", doc._id);
  await removeFromElasticSearch(doc._id);
});

storeProductSchema.post("updateMany", async function (result) {
  const queryFilter = this.getQuery();
  console.log(
    `${result.modifiedCount} döküman güncellendi. Filtre:`,
    queryFilter
  );

  const updatedDocs = await this.model.find(queryFilter);
  for (const doc of updatedDocs) {
    await syncWithElasticSearch(doc._id);
  }
});

export const StoreProduct = mongoose.model("StoreProduct", storeProductSchema);
