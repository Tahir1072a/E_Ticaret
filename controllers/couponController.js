import MasterCoupon, {
  CategoryCoupon,
  SpecificCoupon,
} from "../models/couponModel.js";
import Cart from "../models/cartModel.js";
import { BaseProduct } from "../models/baseProductModel.js";
import mongoose from "mongoose";

const validateCategories = async (categories) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("Lütfen geçerli bir kategori listesi girin.");
  }

  const uniqueCategories = [...new Set(categories)];

  const existingCategories = await BaseProduct.distinct("masterCategoryName", {
    masterCategoryName: { $in: uniqueCategories },
  });

  if (uniqueCategories.length !== existingCategories.length) {
    const missingCategories = uniqueCategories.filter(
      (cat) => !existingCategories.includes(cat)
    );
    throw new Error(
      `Şu kategoriler sistemde bulunamadı: ${missingCategories.join(", ")}`
    );
  }
};

const couponModels = {
  Category: CategoryCoupon,
  Specific: SpecificCoupon,
};

export const createCoupon = async (req, res) => {
  try {
    const { targetUsers, ...couponData } = req.body;
    const { code, expiryDate, type } = couponData;
    const id = req.user._id;

    const existingCoupon = await MasterCoupon.findOne({
      code: code.toUpperCase(),
    });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ message: "Bu kupon kodu zaten kullanılıyor." });
    }

    if (new Date(expiryDate) < new Date()) {
      return res.status(400).json({
        message: "Son kullanma tarihi geçmiş bir kupon tanımlanamaz.",
      });
    }

    if (type === "Category") {
      await validateCategories(couponData.categories);
    }

    const CouponModel = couponModels[type] || MasterCoupon;
    const couponPayload = {
      ...couponData,
      code: code.toUpperCase(),
      targetUsers,
      createdBy: id,
    };

    const newCoupon = await CouponModel.create(couponPayload);

    res.status(201).json({
      message: `${newCoupon.code} kodlu kupon başarıyla oluşturulmuştur.`,
      data: newCoupon,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Bu kupon kodu zaten kullanılıyor." });
    }
    res.status(500).json({ message: err.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user._id;

    const coupon = await MasterCoupon.findOne({
      code: couponCode.toUpperCase(),
    });

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      populate: {
        path: "baseProduct",
        select: "masterCategoryNumber masterCategoryName",
      },
    });

    if (!coupon) {
      return res.status(404).json({ message: "Geçersiz kupon kodu" });
    }
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: "Bu kuponun süresi dolmuş" });
    }
    if (coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "Bu kupon kullanım limitine ulaşmıştır" });
    }
    if (cart.subTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        message: `Minimum sepet tutarı: ${coupon.minPurchaseAmount} TL`,
      });
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Kupon uygulamak için sepetiniz boş olmaması gerekiyor.",
      });
    }

    if (coupon.type === "Specific") {
      if (
        coupon.targetUsers &&
        coupon.targetUsers.length > 0 &&
        !coupon.targetUsers
          .map((id) => id.toString())
          .includes(userId.toString())
      ) {
        return res
          .status(403)
          .json({ message: "Bu kupon size özel değildir!" });
      }
    }

    const subTotal = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    if (subTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        message: `Bu kuponu kullanmak için minimum sepet tutarı: ${coupon.minPurchaseAmount} TL olmalıdır`,
      });
    }
    let discountAmount = 0;

    if (coupon.type === "Category") {
      const categoryNames = coupon.targetCategories;

      const eligibleItems = cart.items.filter((item) => {
        const itemCategory =
          item.product.baseProduct.masterCategoryName.toString();
        return categoryNames.includes(itemCategory);
      });

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          message:
            "Sepetinizde bu kuponun geçerli olduğu kategoride bir ürün bulunmuyor.",
        });
      }

      const discountableTotal = eligibleItems.reduce((sum, currentItem) => {
        return sum + currentItem.price * currentItem.quantity;
      }, 0);

      if (coupon.discountType === "percentage") {
        discountAmount = (discountableTotal * coupon.discountValue) / 100;
      } else if (coupon.discountType === "fixedAmount") {
        discountAmount = eligibleItems.reduce((sum, currentItem) => {
          const discountPerUnit = Math.min(
            currentItem.price,
            coupon.discountValue
          );

          const totalDiscountForItem = discountPerUnit * currentItem.quantity;

          return sum + totalDiscountForItem;
        }, 0);
      }
    } else {
      if (coupon.discountType === "percentage") {
        discountAmount = (subTotal * coupon.discountValue) / 100;
      } else if (coupon.discountType === "fixedAmount") {
        discountAmount = coupon.discountValue;
      }
    }

    const total = Math.max(0, subTotal - discountAmount);

    cart.subTotal = subTotal;
    cart.total = total;
    cart.appliedCoupon = coupon.code;
    const updatedCart = await cart.save();

    res
      .status(200)
      .json({ message: `Kupon başarıyla uygulandı!`, data: updatedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeCouponFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).select("subTotal").lean();

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Kullanıcının sepeti bulunamadı!" });
    }

    const updatedCart = await Cart.findByIdAndUpdate(cart._id, {
      $unset: { appliedCoupon: "" },
      $set: { total: cart.subTotal },
    });

    if (!updatedCart) {
      return res
        .status(404)
        .json({ message: "Kullanıcıya ait bir sepet bulunamamıştır" });
    }

    return res
      .status(200)
      .json({ message: "Başarıyla kupon kaldırılmıştır", data: updatedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await MasterCoupon.findByIdAndUpdate(id, {
      isActive: false,
    });

    if (!coupon) {
      return res.status(404).json({ message: "İlgili kupon bulunamadı" });
    }

    res
      .status(200)
      .json({ message: "Kupon başarıyla oluşturulmuştur", data: coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await MasterCoupon.find({});

    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCouponsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type && !["Master", "Specific", "Category"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Lütfen geçerli bir type giriniz" });
    }

    const coupons = await MasterCoupon.find({ type: type });

    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCouponsByCodeName = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Lütfen bir code numarası giriniz" });
    }

    const coupon = await MasterCoupon.findOne({ code: code });

    if (!coupon) {
      return res.staus(404).json({
        message: `Bu code numarasına ait bir kupon bulunamadı: ${code}`,
      });
    }

    res.status(200).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCouponValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountValue } = req.body;

    if (!discountValue) {
      return res
        .status(404)
        .json({ message: "Lütfen bir discount value değeri gönderin" });
    } else if (discountValue < 0) {
      return res
        .status(400)
        .json({ message: "Negatif bir indirim değeri giremessiniz" });
    }

    const updatedCoupon = await MasterCoupon.findByIdAndUpdate(id, {
      discountValue: discountValue,
    });

    res.status(200).json({
      message: `${updatedCoupon.code} kodlu kupon başarıyla güncellenmiştir`,
      data: updatedCoupon,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
