import { Review } from "../models/reviewModels.js";
import { StoreProduct } from "../models/storeProductModel.js";
import Order from "../models/orderModel.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    const product = await StoreProduct.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Yorum yapılacak ürün bulunamadı" });
    }

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: userId,
    });
    if (alreadyReviewed) {
      return res.status(400).json({ messsage: "Bu ürünü zaten yorumladınız" });
    }

    const userOrders = Order.find({ user: userId, isPaid: true });
    const hasPurchased = (await userOrders).some((order) =>
      order.orderItems.some((item) => item.product.toString() === productId)
    );
    if (!hasPurchased) {
      return res.status(403).json({
        message: "Sadece satın aldığınız ürünlere yorum yapabilirsiniz",
      });
    }

    const review = await Review.create({
      rating,
      comment,
      user: userId,
      product: productId,
    });

    const reviews = await Review.find({ product: productId });
    product.numReviews = reviews.length;
    product.rating = reviews.reduce((acc, item) => item.rating + acc, 0);
    await product.save();

    res
      .status(201)
      .json({ message: "Yorumunuz başarıyla eklendi", data: review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReviewsForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate(
      "user",
      "name surname"
    );

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
