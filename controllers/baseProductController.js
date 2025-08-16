import { BaseProduct } from "../models/baseProductModel.js";
import axios from "axios";

export const createBaseProduct = async (req, res) => {
  try {
    const {
      masterNumber,
      masterName,
      masterPrice,
      masterDate,
      masterCategory,
    } = req.body;

    const newBaseProduct = await BaseProduct.create({
      masterNumber,
      masterName,
      masterPrice,
      masterPriceHistory: [{ price: masterPrice }],
      masterDate,
      masterCategory,
    });

    res.status(201).json({
      message: "Base Product başarıyla oluşturuldu.",
      data: newBaseProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllBaseProduct = async (req, res) => {
  try {
    const products = await BaseProduct.find({});
    res.status(200).json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteBaseProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await BaseProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ message: `Bu ID ye ait bir ürün bulunamamıştır. ID: ${id}` });
    }

    deletedProduct.isActive = false;
    await deletedProduct.save();

    res.status(200).json({ message: `Ürün başarıyla silinmiştir. ID: ${id}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBaseProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const findProduct = await BaseProduct.findById(id);

    if (!findProduct) {
      return res
        .status(404)
        .json({ message: `Bu ID ye ait bir ürün bulunamamaktadır. ID: ${id}` });
    }

    res.status(200).json(findProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBaseProductByName = async (req, res) => {
  try {
    const { masterName } = req.params;

    const findProduct = await BaseProduct.findById(id);

    if (!findProduct) {
      return res.status(404).json({
        message: `Bu isme ait bir ürün bulunamamaktadır. ID: ${masterName}`,
      });
    }

    res.status(200).json(findProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBaseProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPrice, ...otherUpdateData } = req.body;

    const baseProduct = await BaseProduct.findById(id);

    if (!baseProduct) {
      return res.status(404).json({
        message: "Güncellemek istediğiniz ürün mağazada bulunmamaktadır.",
      });
    }

    updatePayload = { ...otherUpdateData };

    if (currentPrice && currentPrice !== baseProduct.currentPrice) {
      updatePayload.currentPrice = currentPrice;

      updatePayload.$push = {
        masterPriceHistory: { price: currentPrice },
      };
    }

    const updatedBaseProduct = await BaseProduct.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    ).lean();

    return res.status(200).json({
      message: "Ürün başarıyla güncellendi",
      data: updatedBaseProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const importFromExternalAPI = async (req, res) => {
  try {
    const id = req.user._id;
    const { data } = await axios.get(
      "http://konerpdevapp1.aselsankonya.com.tr:8000/zwebcomplaint/webcomplaint?sap-client=100",
      {
        auth: {
          username: process.env.SAP_USERNAME,
          password: process.env.SAP_PASSWORD,
        },
      }
    );

    const extrenalProduct = data.items;

    if (!extrenalProduct || extrenalProduct.lenght === 0) {
      return res
        .status(404)
        .json({ message: "Harici kaynaktan ürün bulunamadı." });
    }

    let newProductsCount = 0;
    let existingProductCount = 0;

    for (const extProduct of extrenalProduct) {
      const existingProduct = await BaseProduct.findOne({
        masterNumber: extProduct.matnr,
      });

      if (existingProduct) {
        existingProductCount++;
        continue;
      }

      const newProductsData = {
        masterNumber: extProduct.matnr,
        masterName: extProduct.maktx,
        masterPrice: extProduct.stprs,
        masterCategoryName: extProduct.wgbez,
        masterCategoryNumber: extProduct.matkl,
        masterPriceHistory: [
          {
            price: extProduct.stprs,
            user: id,
          },
        ],
        masterDate: extProduct.dates,
      };

      await BaseProduct.create(newProductsData);
      newProductsCount++;
    }

    res.status(201).json({
      message: "İçe aktarma işlemi tamamlandı",
      newProducts: newProductsCount,
      existingProduct: existingProductCount,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Ürünleri içe aktarırken bir hata oluştu.",
      error: err.message,
    });
  }
};
