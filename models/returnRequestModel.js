import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "WRONG_SIZE",
        "DAMAGED_PRODUCT",
        "NOT_AS_DESCRIBED",
        "CHANGED_MIND",
        "DEFECTIVE",
        "OTHER",
      ],
    },
    customerComments: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
    },
    sellerComments: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);

export default ReturnRequest;
