import mongoose from "mongoose";
import { addressSchema } from "./commonSchemas.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    age: {
      type: Number,
    },
    shippingAddresses: [addressSchema],
    role: {
      type: String,
      required: true,
      enum: ["Customer", "Seller", "Admin", "Applicant"],
      default: "Customer",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { discriminatorKey: "role" }
);

userSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});

export const User = mongoose.model("User", userSchema);

export const Seller = User.discriminator(
  "Seller",
  new mongoose.Schema({
    storeName: {
      type: String,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
      unique: true,
    },
  })
);

export const Admin = User.discriminator(
  "Admin",
  new mongoose.Schema({
    adminId: {
      type: String,
      unique: true,
    },
  })
);

export const Customer = User.discriminator("Customer", new mongoose.Schema({}));
export const Applicant = User.discriminator(
  "Applicant",
  new mongoose.Schema({})
);
