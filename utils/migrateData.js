// import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  BASEPRODUCT_INDEX,
  STOREPRODUCT_INDEX,
  esClient,
} from "../services/elasticSearchServices.js";
import { StoreProduct } from "../models/storeProductModel.js";
import mongoose from "mongoose";
import { BaseProduct } from "../models/baseProductModel.js";

dotenv.config();

const BATCH_SIZE = 500; // Her bulk isteğinde kaç doküman gönderilecek

export const runStoreProductMigration = async () => {
  console.log("Veri aktarımı script'i başlatılıyor...");

  // 1. Veritabanı bağlantısı
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB bağlantısı başarılı.");

  try {
    // 2. Başlamadan önce index'i temizle (isteğe bağlı ama önerilir)
    console.log(`Mevcut '${STOREPRODUCT_INDEX}' index'i siliniyor...`);
    await esClient.indices.delete({
      index: STOREPRODUCT_INDEX,
      ignore_unavailable: true, // Index yoksa hata verme
    });
    console.log("Index başarıyla silindi.");

    // İsteğe Bağlı ama ÖNEMLİ: Index için Mapping oluşturma
    // Bu, ES'e alanların tiplerini önceden söyleyerek daha tutarlı ve performanslı arama sağlar.
    await esClient.indices.create({
      index: STOREPRODUCT_INDEX,
      body: {
        mappings: {
          properties: {
            masterName: { type: "text" },
            masterCategoryName: { type: "text" },
            masterImage: { type: "text" },
            storeName: { type: "text" },
            description: { type: "text" },
            currentPrice: { type: "float" },
            rating: { type: "float" },
            createdAt: { type: "date" },
          },
        },
      },
    });
    console.log("Yeni index mapping ile oluşturuldu.");

    // 3. MongoDB'den verileri cursor ile çek
    const cursor = StoreProduct.find({ isActive: true })
      .populate("baseProduct", "masterName masterCategoryName masterImage")
      .populate("seller", "storeName")
      .cursor();

    let batch = [];
    let totalDocs = 0;

    console.log("Dokümanlar okunuyor ve index'leniyor...");

    // 4. Her bir dokümanı işle ve batch'lere ayır
    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      // Her doküman için bulk isteği formatını oluştur
      batch.push({
        index: { _index: STOREPRODUCT_INDEX, _id: doc._id.toString() },
      });

      const denormalizedBody = {
        description: doc.description,
        currentPrice: doc.currentPrice,
        stock: doc.stock,
        rating: doc.rating,
        createdAt: doc.createdAt,
        masterName: doc.baseProduct?.masterName,
        masterCategoryName: doc.baseProduct?.masterCategoryName,
        masterImage: doc.baseProduct?.masterImage,
        storeName: doc.seller?.storeName,
      };
      batch.push(denormalizedBody);

      // Batch boyutu dolduğunda ES'e gönder
      if (batch.length >= BATCH_SIZE * 2) {
        // Her doküman 2 satır olduğu için *2
        await esClient.bulk({ refresh: false, body: batch });
        totalDocs += batch.length / 2;
        console.log(`${totalDocs} doküman index'lendi...`);
        batch = []; // Batch'i sıfırla
      }
    }

    // 5. Kalan son batch'i gönder
    if (batch.length > 0) {
      await esClient.bulk({ refresh: false, body: batch });
      totalDocs += batch.length / 2;
      console.log(`Kalan ${batch.length / 2} doküman index'lendi.`);
    }

    console.log(
      `\n🎉 Toplam ${totalDocs} doküman başarıyla Elasticsearch'e aktarıldı!`
    );
  } catch (error) {
    console.error("Veri aktarımı sırasında bir hata oluştu:", error);
  } finally {
    // 6. Veritabanı bağlantısını kapat
    await mongoose.connection.close();
    console.log("MongoDB bağlantısı kapatıldı.");
  }
};

export const runMasterProductMigration = async () => {
  console.log("Veri aktarım scripti başlatılıyor...");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB bağlantısı sağlandı");

  try {
    console.log(`Mevcut ${BASEPRODUCT_INDEX} indexi siliniyor.`);
    await esClient.indices.delete({
      index: BASEPRODUCT_INDEX,
      ignore_unavailable: true,
    });
    console.log("Index başarıyla silindi");

    await esClient.indices.create({
      index: BASEPRODUCT_INDEX,
      body: {
        mappings: {
          properties: {
            masterName: { type: "text" },
            masterCategoryName: { type: "text" },
            masterImage: { type: "text" },
            masterPrice: { type: "float" },
            masterPriceHistory: {
              type: "nested",
              properties: {
                price: { type: "float" },
                date: { type: "date" },
                user: { type: "text" },
              },
            },
            masterDate: { type: "date" },
            masterCategoryName: { type: "text" },
            masterStock: { type: "float" },
            masterCategoryNumber: { type: "float" },
          },
        },
      },
    });
    console.log("Yeni index mapping ile oluşturuldu");

    const cursor = BaseProduct.find({ isActive: true })
      .populate({
        path: "masterPriceHistory",
        populate: [
          {
            path: "user",
          },
        ],
      })
      .cursor();

    let batch = [];
    let totalDocs = 0;

    console.log("Dökümanlar okunuyor ve index'leniyor");

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      batch.push({
        index: { _index: BASEPRODUCT_INDEX, _id: doc._id.toString() },
      });

      const denormalizedBody = {
        masterName: doc.masterName,
        masterCategoryName: doc.masterCategoryName,
        masterImage: doc.masterImage,
        masterPrice: doc.masterPrice,
        masterPriceHistory: doc.masterPriceHistory,
        masterDate: doc.masterDate,
        masterStock: doc.masterStock,
        masterCategoryNumber: doc.masterCategoryNumber,
      };
      batch.push(denormalizedBody);

      if (batch.length >= BATCH_SIZE * 2) {
        await esClient.bulk({ refresh: false, body: batch });
        totalDocs += batch.length / 2;
        console.log(`${totalDocs} döküman index'lendi`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await esClient.bulk({ refresh: false, body: batch });
      totalDocs += batch.length / 2;
      console.log(`Kalan ${batch.length / 2} doküman index'lendi.`);
    }
    console.log(
      `\n🎉 Toplam ${totalDocs} doküman başarıyla Elasticsearch'e aktarıldı!`
    );
  } catch (err) {
    console.error("Veri aktarımı sırasında bir hata oluştu:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB bağlantısı kapatıldı.");
  }
};
