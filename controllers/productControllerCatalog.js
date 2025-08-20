import { StoreProduct } from "../models/storeProductModel.js";
import { User } from "../models/usersModel.js";
import APIFeatures from "../utils/apiFeatures.js";

export const getAllPublicProducts = async (req, res) => {
  try {
    const features = new APIFeatures(StoreProduct.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query
      .populate("seller", "storeName")
      .populate("baseProduct", "masterName masterCategory");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await StoreProduct.findById(id)
      .populate("baseProduct", "masterName masterCategory")
      .populate("seller", "storeName")
      .lean();

    if (!product) {
      res
        .status(404)
        .json({ message: `Bu ID ye ait bir ürün bulunamamıştır. ID: ${id}` });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicProductByCategory = async (req, res) => {
  try {
    const { masterCategory } = req.params;

    const relevantBaseProducts = await BaseProduct.find({
      masterCategory: masterCategory,
    }).select("_id");

    if (relevantBaseProducts.length === 0) {
      return res
        .status(404)
        .json({ message: "Bu kategoryie ait bir ürün bulunamadı" });
    }

    const baseProductIds = relevantBaseProducts.map((p) => p._id);

    const products = await StoreProduct.find({
      baseProduct: { $in: baseProductIds },
    })
      .populate("baseProduct", "masterName masterCategory")
      .populate("seller", "storeName")
      .lean();

    if (products.length === 0) {
      res.status(404).json({
        message: `Bu category'e ait herhangi bir ürün bulunamamıştır. Name: ${masterCategory}`,
      });
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicProductsByStoreName = async (req, res) => {
  try {
    const { storeName } = req.params;
    const seller = await User.findOne({ storeName: storeName }).lean();

    if (!seller) {
      return res
        .status(404)
        .json({ message: `Bu isimde bir mağaza bulunamadı: ${storeName}` });
    }

    const products = await StoreProduct.find({ seller: seller._id })
      .populate("baseProduct", "masterName masterCategory")
      .populate("seller", "storeName");

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
