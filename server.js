import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import storeProductsRoutes from "./routes/storeProductsRoutes.js";
import userRoutes from "./routes/usersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartsRoutes from "./routes/cartRoutes.js";
import ordersRoutes from "./routes/orderRoutes.js";
import wholeSaleRoutes from "./routes/wholeSaleRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

import cors from "cors";
import swaggerUi from "swagger-ui-express";

import YAML from "yamljs";
import { StoreProduct } from "./models/storeProductModel.js";
import { Client } from "@elastic/elasticsearch";

// Seller indirimleri hesaplanmıyor. İndiirm hesaplmaa konusunu kapsamlı bir şekilde ele al!!
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(cors()); // Tüm corslara izin ver...

const PORT = 3000;

const esClient = new Client({ node: "http://localhost:9200" });

async function syncData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB veritabanına başarıyla bağlandı.");

    console.log('Mevcut "storeproducts" indeksi siliniyor (varsa)...');
    // Başlamadan önce indeksi temizlemek, tekrar tekrar çalıştırıldığında dublicate veriyi önler.
    await esClient.indices.delete({
      index: "storeproducts",
      ignore_unavailable: true,
    });

    console.log("MongoDB'den tüm StoreProduct verileri çekiliyor...");
    const allProducts = await StoreProduct.find({});

    if (allProducts.length === 0) {
      console.log("Aktarılacak ürün bulunamadı.");
      return;
    }

    console.log(
      `${allProducts.length} adet ürün bulundu. Elasticsearch\'e toplu aktarım başlıyor...`
    );

    // Elasticsearch Bulk API'si için verileri formatla
    const body = allProducts.flatMap((doc) => {
      // 1. doc.toObject() ile objeyi al, içinden _id'yi ayrı bir değişkene, geri kalan her şeyi "documentBody" içine ata.
      const { _id, ...documentBody } = doc.toObject();

      // 2. Bulk API'ye metadata için _id'yi, içerik için ise _id'siz olan documentBody'yi gönder.
      return [
        { index: { _index: "storeproducts", _id: _id.toString() } },
        documentBody,
      ];
    });

    const bulkResponse = await esClient.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.error("Toplu aktarım sırasında hatalar oluştu.");
      // Hataları daha detaylı görmek isterseniz:
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            document: body[i * 2 + 1],
          });
        }
      });
      console.log(
        "Hatalı dökümanlar:",
        JSON.stringify(erroredDocuments, null, 2)
      );
    } else {
      console.log("Tüm veriler başarıyla Elasticsearch'e aktarıldı!");
    }
  } catch (error) {
    console.error("Senkronizasyon sırasında bir hata oluştu:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı.");
  }
}

// syncData();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB bağlantısı başarıyla bağlantı sağlandı");
  })
  .catch((err) => {
    console.error("Veritabanı bağlantı hatası:", err);
  });

const swaggerDocument = YAML.load("./settings/swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/store-products", storeProductsRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/carts", cartsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/wholesale", wholeSaleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/coupons", couponRoutes);

app.get("/", (req, res) => {
  res.send("E-ticaret API ana sayfası");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
