import mongoose from "mongoose";

const returnedItemSchema = new mongoose.Schema({
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

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
    returnedItems: [returnedItemSchema],
    reason: {
      type: String,
      required: true,
      enum: [
        "WRONG_SIZE",
        "DAMAGED_PRODUCT",
        "NOT_AS_DESCRIBED",
        "CHANGED_MIND",
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
