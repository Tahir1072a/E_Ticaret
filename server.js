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

// Seller indirimleri hesaplanmıyor. İndiirm hesaplmaa konusunu kapsamlı bir şekilde ele al!!
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(cors()); // Tüm corslara izin ver...

const PORT = 3000;

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
