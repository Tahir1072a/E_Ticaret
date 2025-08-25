import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import { StoreProduct } from "../models/storeProductModel.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      populate: [
        {
          path: "baseProduct",
          select: "masterName -_id",
        },
        {
          path: "seller",
          select: "name storeName",
        },
      ],
    });

    if (!cart) {
      return res.status(200).json({ message: "Sepetiniz Boş" });
    }

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await StoreProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Böyle bir ürün bulunamadı" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.currentPrice,
      });
    }

    const total = cart.items.reduce((acc, item) => {
      acc + item.price * item.quantity;
    }, 0);
    cart.total = total;

    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const modifyCartQuantity = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    const userId = req.user._id;

    quantity = Number(quantity);

    const product = await StoreProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Böyle bir ürün bulunamadı" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res
        .status(400)
        .json({ message: "Kullanıcının herhangi bri sepeti bulunmamaktadır!" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (
        (cart.items[itemIndex].quantity === 1 && quantity > 0) ||
        cart.items[itemIndex].quantity > 0
      ) {
        cart.items[itemIndex].quantity += quantity;
      }
    } else {
      return res
        .status(404)
        .json({ message: "Sepetinizde böyle bir ürün bulunmamaktadır" });
    }

    const updatedCart = await cart.save();

    res.status(200).json({
      message: "Ürün miktarı başarıyla güncellenmiştir",
      data: updatedCart,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeItemFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Sepet bulunamadı" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    res.status(200).json({ message: "Ürün sepetten kaldırıldı", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user._id;

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Kupon uygulamak için sepetiniz boş olmaması gerekiyor.",
      });
    }

    if (!coupon) {
      return res.status(404).json({ message: "Geçersiz kupon kodu" });
    } else if (!coupon.isActive) {
      return res.status(400).json({ message: "Bu kupon artık aktif değil." });
    } else if (!coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: "Bu kuponun süresi dolmuş" });
    } else if (coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "Bu kupon kullanım limitine ulaşmıştır" });
    } else if (
      coupon.targetUsers &&
      coupon.targetUsers.length > 0 &&
      !coupon.targetUsers.map((id) => id.toString()).includes(userId.toString())
    ) {
      return res.status(403).json({ message: "Bu kupon size özel değildir!" });
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

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subTotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === "fixedAmount") {
      discount = coupon.discountValue;
    }

    const total = Math.max(0, subTotal - discount);

    cart.subTotal = subTotal;
    cart.total = total;
    cart.appliedCoupon = coupon.code;
    await cart.save();

    res.status(200).json({ message: `Kupon başarıyla uygulandı!`, data: cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
