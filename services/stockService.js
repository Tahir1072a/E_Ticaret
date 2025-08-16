import mongoose from "mongoose";
import { StoreProduct } from "../models/storeProductModel.js";
import { BaseProduct } from "../models/baseProductModel.js";

export const updateStockAndInventory = async ({
  storeProductId,
  sellerId,
  quantity,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (typeof quantity !== "number" || quantity === 0) {
      throw new Error("Geçerli bir stok değişim miktarı giriniz.");
    }

    const product = await StoreProduct.findById(storeProductId).session(
      session
    );
    if (!product) throw new Error("Ürün bulunamadı.");

    if (product.seller.toString() !== sellerId.toString()) {
      throw new Error("Bu ürün üzerinde işlem yapma yetkiniz yok.");
    }

    const baseProduct = await BaseProduct.findById(product.baseProduct).session(
      session
    );
    if (!baseProduct) throw new Error("İlişkili ana ürün bulunamadı.");

    if (product.stock + quantity < 0) {
      throw new Error(`Stok eksiye düşürülemez. Mevcut stok: ${product.stock}`);
    }
    if (product.stock + quantity > 1000) {
      throw new Error("Mağaza stoğu 1000 adedi aşamaz.");
    }
    if (quantity > 0 && baseProduct.masterStock < quantity) {
      throw new Error(
        `Yetersiz toptan stok. Mevcut ana stok: ${baseProduct.masterStock}`
      );
    }

    await BaseProduct.findByIdAndUpdate(
      product.baseProduct,
      { $inc: { masterStock: -quantity } },
      { session }
    );
    const updatedProduct = await StoreProduct.findByIdAndUpdate(
      storeProductId,
      { $inc: { stock: quantity } },
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedProduct;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
