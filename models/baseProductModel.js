import mongoose from "mongoose";
import { priceHistoryEntrySchema } from "./commonSchemas.js";
import { Client } from "@elastic/elasticsearch";

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

const esClient = new Client({ node: "http://localhost:9200" });

const syncWithElasticSearch = async (docId, model) => {
  try {
    const docToSync = await model.findById(docId);

    if (!docToSync) {
      console.error(`Senkronizasyon için döküman bulunamadı: ${docId}`);
      return;
    }

    const body = docToSync.toObject();

    await esClient.index({
      index: "baseproducts",
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
      index: "baseproducts",
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

baseProductSchema.post("save", async function (doc) {
  console.log("Post-save hook triggered for:", doc._id);
  await syncWithElasticSearch(doc._id, this.constructor);
});

baseProductSchema.post("findOneAndUpdate", async function (doc) {
  console.log("Post-findOneAndUpdate hook triggered for:", doc._id);
  await syncWithElasticSearch(doc._id, this.model);
});

baseProductSchema.post("findOneAndDelete", async function (doc) {
  console.log("Post-findOneAndDelete hook triggered for:", doc._id);
  await removeFromElasticSearch(doc._id);
});

baseProductSchema.post("updateMany", async function (result) {
  const queryFilter = this.getQuery();
  console.log(
    `${result.modifiedCount} döküman güncellendi. Filtre:`,
    queryFilter
  );

  const updatedDocs = await this.model.find(queryFilter);

  if (updatedDocs.length === 0) return;

  const body = updatedDocs.flatMap((doc) => [
    { index: { _index: "baseproducts", _id: doc._id.toString() } },
    doc.toObject(),
  ]);

  try {
    await esClient.bulk({ refresh: true, body });
    console.log(
      `${updatedDocs.length} doküman başarıyla bulk olarak senkronize edildi.`
    );
  } catch (err) {
    console.error("Elasticsearch bulk senkronizasyon hatası:", err);
  }
});

export const BaseProduct = mongoose.model("Base Product", baseProductSchema);
