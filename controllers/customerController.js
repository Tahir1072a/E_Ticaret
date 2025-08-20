import { Seller, User } from "../models/usersModel.js";
import Order from "../models/orderModel.js";
import Coupon from "../models/couponModel.js";

export const getAllSeller = async (req, res) => {
  try {
    const sellers = await Seller.find({}).select("name storeName").lean();

    res.status(200).json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const id = req.user._id;

    await User.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({ message: "Kullanıcı hesabı başarıyla silinmiştir" });
  } catch (err) {
    res.status(500).json({ message: message });
  }
};

export const getAllAdresses = async (req, res) => {
  try {
    const id = req.user.id;

    const addresses = await User.findById(id).select("shippingAddresses");

    if (addresses.length === 0) {
      return res
        .status(404)
        .json({ message: "Kayıtlı adresiniz bulunamamıştır" });
    }

    res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const id = req.user._id;
    const { shippingAddresses, ...customerData } = req.body;

    const customerPayload = { $set: customerData };
    if (shippingAddress && shippingAddress.address) {
      customerPayload.$push = {
        shippingAddresses: {
          ...shippingAddresses,
        },
      };
    }

    const updatedCustomer = await User.findOneAndUpdate(id, customerPayload, {
      new: true,
    }).lean();

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      message: "Customer başarıyla güncellendi",
      data: updatedCustomer,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const id = req.user._id;

    const orders = await Order.find({ user: id })
      .select("orderItems")
      .populate("user", "email name")
      .populate("seller", "email name");

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: message });
  }
};

export const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const orderDetail = await Order.findOne({ _id: id, user: userId })
      .populate("user")
      .populate("seller")
      .populate({
        path: "orderItems.product",
      });

    if (!orderDetail) {
      return res
        .status(404)
        .json({ message: "Bu id'ye ait bir ürün bulunamamıştır!" });
    }

    res.status(200).json(orderDetail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const prizePool = [
  {
    description: "%10 İndirim Kuponu",
    discountType: "percentage",
    discountValue: 10,
    expiryDays: 7,
  },
  {
    description: "25 TL İndirim Kuponu",
    discountType: "fixedAmount",
    discountValue: 25,
    expiryDays: 14,
  },
  {
    description: "%5 İndirim Kuponu",
    discountType: "percentage",
    discountValue: 5,
    expiryDays: 30,
  },
  {
    description: "50 TL İndirim Kuponu",
    discountType: "fixedAmount",
    discountValue: 50,
    expiryDays: 7,
    minPurchaseAmount: 300,
  },
];

export const openPackage = async (req, res) => {
  try {
    const user = req.user;

    const randomPrize = prizePool[Math.floor(Math.random() * prizePool.length)];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + randomPrize.expiryDays);

    const uniqueCode = `PAKET-${user.username.toUpperCase()}-${Date.now().toString(
      36
    )}`;

    const newCoupon = await Coupon.create({
      code: uniqueCode,
      description: `Paketten çıkan hediye: ${randomPrize.description}`,
      discountType: randomPrize.discountType,
      discountValue: randomPrize.discountValue,
      expiryDate: expiryDate,
      createdBy: user._id,
      targetUsers: [user._id],
      usageLimit: 1,
      minPurchaseAmount: randomPrize.minPurchaseAmount || 0,
    });

    res.status(201).json({
      message: `Tebrikler! Bir paketi açtın ve ${randomPrize.description} kazandın!`,
      data: newCoupon,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        populate: {
          path: "baseProduct",
          select: "masterName",
        },
      })
      .lean();

    res.status(200).json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const id = req.user._id;
    const { productId } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $addToSet: { wishlist: productId },
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Ürün favorilere eklendi", data: updatedUser.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const id = req.user._id;
    const { productId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    res.status(200).json({
      message: "Ürün favorilerden kaldırıldı.",
      data: updatedUser.wishlist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
