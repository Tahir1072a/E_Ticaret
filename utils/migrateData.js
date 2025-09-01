// import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  STOREPRODUCT_INDEX,
  esClient,
} from "../services/elasticSearchServices.js";
import { StoreProduct } from "../models/storeProductModel.js";
import mongoose from "mongoose";

dotenv.config();

const BATCH_SIZE = 500; // Her bulk isteğinde kaç doküman gönderilecek

export const runMigration = async () => {
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
            sellerName: { type: "text" },
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
        sellerName: doc.seller?.storeName,
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
