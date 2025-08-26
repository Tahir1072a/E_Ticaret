export const createStoreProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      baseProductId,
      currentPrice,
      stock: sellerStock,
      description,
      imgUrl,
    } = req.body;
    const sellerId = req.user._id;

    if (sellerStock > 1000) {
      return res.status(400).json({
        message: "Bir üründen 1000 adetten fazla sipariş edemessiniz.",
      });
    }

    const baseProduct = await BaseProduct.findById(baseProductId).session(
      session
    );
    if (!baseProduct) {
      return res.status(404).json({
        message:
          "Mağazanıza eklemek istediğiniz ürün toptan mağazamızda bulunmamaktadır.",
      });
    }

    if (sellerStock > baseProduct.masterStock) {
      return res
        .status(400)
        .json({ message: "Elimizde yeteri kadar ürün bulunmamaktadır." });
    }

    const existingStoreProduct = await StoreProduct.findOne({
      seller: sellerId,
      baseProduct: baseProductId,
    });

    if (existingStoreProduct) {
      return res
        .status(400)
        .json({ message: "Eklemeye çalıştığınız ürün mağazamızda mevcuddur." });
    }

    baseProduct.masterStock -= sellerStock;
    await baseProduct.save({ session });

    const newStoreProductData = {
      baseProduct: baseProductId,
      seller: sellerId,
      currentPrice: currentPrice,
      priceHistory: [{ price: currentPrice, user: sellerId }],
      stock: sellerStock,
      description: description,
      imgUrl: imgUrl,
      isActive: true,
    };

    const createdProducts = await StoreProduct.create([newStoreProductData], {
      session: session,
    });
    const newStoreProduct = createdProducts[0];
    await session.commitTransaction();

    res.status(201).json({
      message: `${baseProduct.masterName} ürünü mağazanıza başarıyla eklenmiştir. `,
      data: newStoreProduct,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await StoreProduct.findOne({
      _id: id,
      seller: sellerId,
    }).populate("baseProduct", "masterName");

    if (!product) {
      return res.status(404).json({
        message: "Bu ürünü bulamadık veya silme yetkiniz yok.",
      });
    }
    const name = product.baseProduct.masterName;

    product.isActive = false;
    await product.save();

    return res
      .status(200)
      .json({ message: `${name} ürünü başarıyla silinmiştir. ID: ${id}` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllStoreProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await StoreProduct.find({ seller: sellerId })
      .populate("baseProduct", "masterName productType masterPrice")
      .lean();

    if (!products) {
      return res.status(404).json({ message: "Hiçbir ürün bulunamamıştır." });
    }

    return res.status(200).json({ data: products });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getStoreProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await StoreProduct.findOne({ _id: id, seller: sellerId })
      .populate("baseProduct", "masterName productType")
      .lean(); // Performan arttırıcı.

    if (!product) {
      return res
        .status(404)
        .json({ message: `Bu ID ile bir ürün bulunamadı: ${id}` });
    }

    return res.status(200).json({ data: product });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getStoreProductByName = async (req, res) => {
  try {
    const { baseProductName } = req.params;
    const sellerId = req.user._id;

    const base = await BaseProduct.findOne({
      masterName: baseProductName,
    }).lean();

    if (!base) {
      return res.status(404).json({
        message: `Bu isimle bir ürün yoktur: ${baseProductName}`,
      });
    }
    const product = await StoreProduct.findOne({
      seller: sellerId,
      baseProduct: base._id,
    })
      .populate("baseProduct", "masterName productType")
      .lean();

    if (!product) {
      return res.status(404).json({
        message: `Bu isimle mağazanızda ürün bulunamadı: ${baseProductName}`,
      });
    }

    return res.status(200).json({ data: product });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;
    const { baseProductId } = req.body;

    const { currentPrice, quantity, ...otherUpdateData } = req.body;

    const product = await StoreProduct.findOne({
      _id: id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Ürün bulunamadı veya bu ürün üzerinde yetkiniz yok.",
      });
    }

    const duplicate = await StoreProduct.findOne({
      _id: { $ne: id },
      seller: sellerId,
      baseProduct: baseProductId,
    });

    if (duplicate) {
      return res
        .status(400)
        .json({ message: "Bu ürün mağazanıda zaten kayıtlıdır." });
    }

    const updatePayload = { $set: otherUpdateData };

    if (currentPrice && currentPrice !== product.currentPrice) {
      updatePayload.currentPrice = currentPrice;

      updatePayload.$push = {
        priceHistory: { price: currentPrice, user: sellerId },
      };
    }

    const updatedStoreProduct = await StoreProduct.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    ).lean();

    return res.status(200).json({
      message: `${product.baseProduct.masterName} başarıyla güncellendi.`,
      data: updatedStoreProduct,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const sellerId = req.user_id;

    const product = await StoreProduct.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    if (product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        message: "Bu ürün üzerinde işlem yapma yetkiniz bulunmamaktadır.",
      });
    }

    const updatedProduct = await updateStockAndInventory({
      storeProductId: id,
      sellerId: sellerId,
      quantity: quantity,
    });

    res.status(200).json({
      message: `Stok başarıyla güncellendi. Yeni stock: ${updatedProduct.stock}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductBySellerId = async (req, res) => {
  try {
    const sellerId = req.user_id;

    const products = await StoreProduct.find({
      seller: sellerId,
    }).populate("baseProduct", "masterName masterCategory");

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "Mağazanızda hiçbir ürün bulunmamaktadır." });
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
