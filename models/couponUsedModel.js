import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterCoupon",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  { timestamps: { createdAt: "usedAt" } }
);

couponUsageSchema.index({ user: 1, coupon: 1 }, { unique: 1 });

// await CouponUsage.find({ coupon: "ID_OF_A_POPULAR_COUPON" }) => hızlandırır
couponUsageSchema.index({ coupon: 1 });

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export default CouponUsage;
