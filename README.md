# E-Ticaret Platformu Backend API

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Tahir1072a/e_ticaret)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bu proje, çok rollü (Admin, Satıcı, Müşteri) bir e-ticaret platformu için geliştirilmiş, Node.js tabanlı, ölçeklenebilir ve güvenli bir RESTful API sunucusudur.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)
- [Kullanım](#-kullanım)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Gelecek Planları](#-gelecek-planları)
- [Lisans](#-lisans)

## 🚀 Özellikler

### 🔐 Çok Rollü Kimlik Doğrulama
- JWT (JSON Web Token) tabanlı güvenli kimlik doğrulama
- Rol tabanlı yetkilendirme (RBAC) sistemi
- Desteklenen roller: `Admin`, `Seller`, `Customer`, `Applicant`

### 📦 Ürün Yönetimi
- **İki Katmanlı Ürün Sistemi:**
  - Base Product (Toptan ürünler) - Admin yönetimi
  - Store Product (Mağaza ürünleri) - Satıcı yönetimi
- Kapsamlı ürün kategorilendirme
- Stok takibi ve yönetimi

### 🛒 Sipariş ve Ödeme
- Sepet oluşturma ve yönetimi
- Sipariş verme akışı
- Ödeme onayı sistemi
- Sipariş durumu takibi

### 🔒 Veri Bütünlüğü
- **Mongoose Transactions** kullanımı
- Kritik işlemlerde ACID özelliklerinin korunması
- Ödeme onayı ve satıcı başvuru süreçlerinde güvenli veri işleme

### 👥 Satıcı Başvuru Sistemi
- Kullanıcıların satıcı başvurusu yapabilmesi
- Admin onay/red sistemi
- Başvuru durumu takibi

### 📚 Kapsamlı Dokümantasyon
- **OpenAPI (Swagger)** standartlarında hazırlanmış
- İnteraktif API dokümantasyonu
- Tüm endpoint'lerin detaylı açıklamaları

### ⚡ Performans Optimizasyonu
- Soft-delete (pasif silme) sistemi
- Mongoose `.lean()` ve `.populate()` optimizasyonları
- Verimli sorgu performansı

## 🛠️ Teknolojiler

| Kategori | Teknoloji |
|----------|-----------|
| **Backend** | Node.js, Express.js |
| **Veritabanı** | MongoDB, Mongoose (ODM) |
| **Güvenlik** | JSON Web Token (JWT), bcryptjs |
| **Dokümantasyon** | Swagger (OpenAPI), swagger-ui-express, yamljs |
| **Diğer** | dotenv, cors |

## ⚙️ Kurulum

### Gereksinimler

- **Node.js** (v18.0.0 veya üstü)
- **MongoDB** (Community veya Atlas)
- **npm** veya **yarn** paket yöneticisi

### Kurulum Adımları

1. **Repository'yi klonlayın:**
   ```bash
   git clone https://github.com/Tahir1072a/e_ticaret.git
   cd e_ticaret
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini yapılandırın:**
   
   Proje kök dizininde `.env` dosyası oluşturun:
   ```env
   # MongoDB Bağlantı URL'i
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority
   
   # JWT Gizli Anahtarı (güçlü bir parola kullanın)
   JWT_SECRET=super_secret_jwt_key_2024_secure_random_string
   
   # Sunucu Portu (opsiyonel, varsayılan: 3000)
   PORT=3000
   
   # Node Ortamı
   NODE_ENV=development
   ```

4. **Uygulamayı başlatın:**
   
   **Geliştirme modunda:**
   ```bash
   npm run dev
   ```
   
   **Üretim modunda:**
   ```bash
   npm start
   ```

5. **Başarılı kurulumu doğrulayın:**
   
   Tarayıcınızda `http://localhost:3000` adresini ziyaret edin.

## 📖 API Dokümantasyonu

Sunucu çalışırken, kapsamlı ve interaktif API dokümantasyonuna aşağıdaki adresten erişebilirsiniz:

🌐 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### Temel API Endpoint'leri

| Grup | Endpoint | Açıklama |
|------|----------|----------|
| **Auth** | `POST /api/auth/login` | Kullanıcı girişi |
| **Auth** | `POST /api/auth/register` | Kullanıcı kaydı |
| **Products** | `GET /api/products` | Ürün listesi |
| **Orders** | `POST /api/orders` | Sipariş oluşturma |
| **Cart** | `GET /api/cart` | Sepet görüntüleme |
| **Admin** | `GET /api/admin/users` | Kullanıcı yönetimi |

## 📂 Proje Yapısı

```
e_ticaret/
├── 📁 controllers/          # İş mantığı ve request handling
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── adminController.js
├── 📁 middleware/           # Ara katman fonksiyonları
│   ├── auth.js
│   ├── rbac.js
│   └── validation.js
├── 📁 models/              # MongoDB şemaları
│   ├── User.js
│   ├── BaseProduct.js
│   ├── StoreProduct.js
│   └── Order.js
├── 📁 routes/              # API route tanımları
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── admin.js
├── 📁 services/            # İş mantığı servisleri
│   ├── authService.js
│   ├── productService.js
│   └── paymentService.js
├── 📁 settings/            # Yapılandırma dosyaları
│   └── swagger.yaml
├── 📄 .env.example         # Örnek ortam değişkenleri
├── 📄 package.json
├── 📄 README.md
└── 📄 server.js           # Ana sunucu dosyası
```

## 🎯 Kullanım

### Temel Kullanım Senaryoları

#### 1. Kullanıcı Kaydı ve Girişi
```javascript
// Kayıt
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "Customer"
}

// Giriş
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### 2. Ürün İşlemleri
```javascript
// Ürün listesi
GET /api/products?page=1&limit=10&category=electronics

// Ürün detayı
GET /api/products/:id
```

#### 3. Sepet ve Sipariş
```javascript
// Sepete ürün ekleme
POST /api/cart/add
{
  "productId": "product_id",
  "quantity": 2
}

// Sipariş oluşturma
POST /api/orders
{
  "items": [...],
  "shippingAddress": {...}
}
```

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak isterseniz:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje [MIT Lisansı](https://opensource.org/licenses/MIT) altında lisanslanmıştır.

---

## 📞 İletişim

**Proje Sahibi:** Tahir1072a  
**GitHub:** [https://github.com/Tahir1072a/e_ticaret](https://github.com/Tahir1072a/e_ticaret)

---

<div align="center">
  <p>⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!</p>
  <p>Made with ❤️ by Tahir1072a</p>
</div>
