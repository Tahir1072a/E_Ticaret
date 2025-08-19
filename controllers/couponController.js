import Coupon from "../models/couponModel";

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      expiryDate,
      usageLimit,
    } = req.body;

    const id = req.user._id;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ message: "Bu kupon zaten kullanılmaktadır." });
    }

    if (new Date(expiryDate) < new Date()) {
      return res
        .status(400)
        .json({ message: "Son kullanma tarihi geçmiş bir kupon tanımlanamaz" });
    }

    const newCoupon = await Coupon.create({
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      expiryDate,
      usageLimit,
      createdBy: id,
    });

    res.status(201).josn({
      message: `${code.toUpperCase()} kodlu kupon başarıyla oluşturulmuştur`,
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
