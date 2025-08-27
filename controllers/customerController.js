import { Seller, User } from "../models/usersModel.js";
import Order from "../models/orderModel.js";
import MasterCoupon, { SpecificCoupon } from "../models/couponModel.js";

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
    res.status(500).json({ message: err.message });
  }
};

export const getAllAdresses = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).select("shippingAddresses").lean();

    if (user.shippingAddresses.length === 0) {
      return res
        .status(404)
        .json({ message: "Kayıtlı adresiniz bulunamamıştır" });
    }

    res.status(200).json(user.shippingAddresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerAddressById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Lütfen istediğiniz adresin id değerini getiriniz! ",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const customerAddress = user.shippingAddresses.id(id);

    if (!customerAddress) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }

    res.status(200).json(customerAddress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const userId = req.user._id;

    const coupons = await SpecificCoupon.find({ targetUsers: userId });
    const publicCoupons = await MasterCoupon.find({});

    if (
      (!coupons && !publicCoupons) ||
      (coupons.length === 0 && publicCoupons.length === 0)
    ) {
      return res
        .status(404)
        .json({ message: "Size atanmış bir kupon bulunamadı." });
    }

    const totalCoupons = [...coupons, ...publicCoupons];

    res.status(200).json({
      message: "Kuponlar başarıyla getirildi.",
      data: totalCoupons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const id = req.user._id;
    const { ...customerData } = req.body;

    const updatedCustomer = await User.findByIdAndUpdate(
      id,
      { $set: customerData },
      {
        new: true,
      }
    ).lean();

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

export const addCustomerAddress = async (req, res) => {
  try {
    const id = req.user._id;
    const { shippingAddress } = req.body;

    if (!shippingAddress)
      return res
        .status(404)
        .json({ message: "Lütfen eklemek için bir adres bilgisi gönderiniz." });

    const updatedCustomerData = await User.findByIdAndUpdate(
      id,
      {
        $push: { shippingAddresses: shippingAddress },
      },
      { new: true }
    );

    if (!updatedCustomerData)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    res.status(200).json({
      message: "Customer başarıyla güncellenmiştir.",
      data: updatedCustomerData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomerAddress = async (req, res) => {
  try {
    const id = req.user._id;
    const { id: addressId } = req.params;

    if (!addressId)
      return res.status(404).json({ message: "Adress ID si belirtilmedi." });

    const deletedAdress = await User.findByIdAndUpdate(
      id,
      {
        $pull: { shippingAddresses: { _id: addressId } },
      },
      { new: true }
    );

    if (!deletedAdress) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      message: "Adres başarıyla silinmiştir.",
      data: deletedAdress.shippingAddresses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMultipleCustomerAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { ids } = req.params;

    if ((!ids && !Array.isArray(ids)) || ids.length === 0) {
      return res.status(400).json({
        message:
          "Lütfen silinecek adreslerin id değerlerini bir dizi olarak return ediniz",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { shippingAddresses: { _id: { $in: ids } } },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.status(200).json({
      message: "Seçilen adresler başarıyla silinmiştir",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomerAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateAddress = req.body;

    if (!id)
      return res.status(400).json({
        message: "Lütfen güncellenmesini istediğiniz adresi seçiniz.",
      });

    const updateFields = {};
    for (const key in updateAddress) {
      updateFields[`shippingAddresses.$.${key}`] = updateAddress[key];
    }

    const result = await User.updateOne(
      { _id: userId, "shippingAddresses._id": id },
      { $set: updateFields }
    );

    if (result.nModified === 0) {
      return res
        .status(400)
        .json({ message: "Kullanıcı veya belirtilen adres bulunamadı" });
    }

    return res
      .status(200)
      .json({ message: "Kullanıcı adresleri başarıyla güncellenmiştir" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const id = req.user._id;

    const orders = await Order.find({ user: id })
      .select("orderItems")
      .populate("user", "email name");

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const orderDetail = await Order.findOne({ _id: id, user: userId })
      .populate("user")
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

    const newCoupon = await MasterCoupon.create({
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
