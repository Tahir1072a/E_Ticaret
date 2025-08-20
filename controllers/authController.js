import mongoose from "mongoose";
import SellerApplication from "../models/sellerApplicationModel.js";
import { User } from "../models/usersModel.js";
import { createHash } from "./userController.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ message: "Bu e-postaya sahip bir kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Hatalı şifre." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.status(200).json({
      message: "Giriş başarılı!",
      token: token,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    // const userExists = await User.findOne({
    //   $or: [{ email: email }, { username: username }],
    // });

    const userExistWithUsername = await User.findOne({ username: username });
    const userExistsWitEmail = await User.findOne({ email: email });

    if (userExistsWitEmail) {
      return res
        .status(400)
        .json({ message: "Bu emaile sahip kullanıcı zaten bulunmaktadır." });
    } else if (userExistWithUsername) {
      return res.status(400).json({
        message: "Bu username'e sahip kullanıcı zaten bulunmaktadır.",
      });
    }

    let newUser;
    const userData = req.body;
    userData.role = "Customer";

    userData.password = await createHash(password);
    newUser = await User.create(userData);

    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res
      .status(201)
      .json({ message: "Kullanıcı başarıyla kaydedildi", token: token });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const sellerRegister = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, username, password, name, surname, phoneNumber, age } =
      req.body;
    const { storeName, shippingAddress } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res
        .status(400)
        .json({ message: "Bu kullanıcı zaten sisteme kayıtlıdır." });
    }

    const hashedPassword = await createHash(password);

    const UserData = {
      email,
      username,
      password: hashedPassword,
      name,
      surname,
      phoneNumber,
      age,
      shippingAddress: shippingAddress,
      role: "Applicant",
    };

    const users = await User.create([UserData], { session });
    const user = users[0];

    const application = {
      user: user._id,
      storeName: storeName,
      shippingAddress: shippingAddress,
      status: "pending",
    };

    await SellerApplication.create([application], { session });
    await session.commitTransaction();

    res.status(201).json({
      message:
        "Seller başvurunuz işleme alınmıştır. Gerekli bilgilendirme en kısa sürede yapılacaktır",
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

export const changePassword = async (req, res) => {
  try {
    const id = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Lütfen uzunluğu en az 6 karakter olan bir şifre giriniz",
      });
    }

    const currentUser = await User.findById(id).select("+password");
    const isMatched = await bcrypt.compare(oldPassword, currentUser.password);

    if (!isMatched) {
      return res.status(400).json({ message: "Girdiğiniz şifre hatalı" });
    }

    currentUser.password = await createHash(newPassword);
    await currentUser.save();
    res.status(200).json({ message: "Şifreniz başarıyla değiştirilmiştir" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
