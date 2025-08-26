import mongoose from "mongoose";

const masterCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixedAmount"],
      default: "percentage",
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Master", "Specific", "Category"],
      default: "Master",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { discriminatorKey: "couponType", timestamps: true }
);

masterCouponSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

const MasterCoupon = mongoose.model("masterCoupon", masterCouponSchema);

// Kişiye özel tanımlı kuponlar
export const SpecificCoupon = MasterCoupon.discriminator(
  "Specific",
  new mongoose.Schema({
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  })
);

export const CategoryCoupon = MasterCoupon.discriminator(
  "Category",
  new mongoose.Schema({
    targetCategories: [
      {
        type: String,
        required: true,
      },
    ],
  })
);

export default MasterCoupon;
