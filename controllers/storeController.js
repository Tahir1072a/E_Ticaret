import { StoreProduct } from "../models/storeProductModel.js";

function calculateDiscount(percentage, price) {
  return price - (price * percentage) / 100;
}

export const startSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercentage } = req.body;
    const sellerId = req.user._id;

    if (!discountPercentage) {
      return res.status(400).json({
        message: "Lütfen bir indirim oranı giriniz",
      });
    }

    if (discountPercentage <= 0 && discountPercentage >= 100) {
      return res
        .status(400)
        .json({ message: "Lütfen geçerli bir indirim oranı giriniz" });
    }

    const product = await StoreProduct.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Yetkili olduğunuz bir ürün bulunamadı" });
    }

    product.onSale = true;
    product.salePrice = calculateDiscount(
      discountPercentage,
      product.currentPrice
    );
    await product.save();

    res
      .status(200)
      .json({ message: "Ürün başarıyla indirime girdi.", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const stopSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user_id;

    const product = await StoreProduct.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res.status(400).json({ message: "Aradığınız ürün bulunamadı" });
    }

    if (!product.onSale)
      return res.status(400).json({ message: "Bu ürün zaten indrimde değil" });

    const updatedProduct = await StoreProduct.findByIdAndUpdate(
      id,
      { onSale: false, $unset: { salePrice: "" } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Ürün indirimden çıkarıldı", data: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const applySaleAllProducts = async (req, res) => {
  try {
    const { discountPercentage } = req.body;
    const sellerId = req.user._id;

    if (!discountPercentage || discountPercentage <= 0) {
      return res
        .status(400)
        .json({ message: "Lütfen düzgün bir indirim oranı giriniz" });
    }

    const sellerHasProducts = await StoreProduct.findOne({
      seller: sellerId,
    }).lean();

    if (!sellerHasProducts) {
      return res
        .status(404)
        .json({ message: "Mağazanızda hiçbir ürün bulunamamaktadır" });
    }

    await StoreProduct.updateMany({ seller: sellerId }, [
      {
        $set: {
          onSale: true,
          $round: [
            {
              $subtract: [
                "$price",
                {
                  $multiply: ["$price", discountPercentage / 100],
                },
              ],
            },
            2,
          ],
        },
      },
    ]);

    res
      .status(200)
      .json({ message: "Tüm ürünlere indirim başarıyla uygulandı!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeSaleAllProducts = async (req, res) => {
  try {
    const sellerId = req.sellerId;

    const sellerHasProducts = await StoreProduct.findOne({
      seller: sellerId,
    }).lean();

    if (!sellerHasProducts) {
      return res
        .status(404)
        .json({ message: "Mağazanızda hiçbir ürün bulunamamaktadır" });
    }

    const result = await StoreProduct.updateMany({ seller: sellerId }, [
      {
        $set: { onSale: false },
        $unset: { salePrice: "" },
      },
    ]);

    return res.status(200).json({
      message: `İndirimler başarıyla kaldırıldı. ${result.modifiedCount} ürün güncellendi.`,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
