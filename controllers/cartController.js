import Cart from "../models/cartModel.js";
import { StoreProduct } from "../models/storeProductModel.js";

function validateQuantity(product, finalQuantity) {
  if (product.stock >= finalQuantity && finalQuantity >= 0) {
    return true;
  }
  return false;
}

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

    let finalQuantity = quantity;
    if (itemIndex > -1) {
      finalQuantity += cart.items[itemIndex].quantity;
    }

    if (!validateQuantity(product, finalQuantity)) {
      return res
        .status(400)
        .json({ message: "Almak istediğiniz miktarda stok bulunmamaktadır." });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.currentPrice,
      });
    }

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
        .json({ message: "Kullanıcının herhangi bir sepeti bulunmamaktadır!" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let finalQuantity = quantity;
    if (itemIndex > -1) {
      finalQuantity += cart.items[itemIndex].quantity;
    }

    if (!validateQuantity(product, finalQuantity)) {
      return res
        .status(400)
        .json({ message: "Almak istediğiniz miktarda stok bulunmamaktadır." });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
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

    const removedCart = await cart.save();
    res.status(200).json({ message: "Ürün sepetten kaldırıldı", removedCart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
