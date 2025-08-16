import SellerApplication from "../models/sellerApplicationModel.js";
import { Seller, User } from "../models/usersModel.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

export const createApplication = async (req, res) => {
  try {
    const { storeName, shippingAddress } = req.body;

    if (!storeName) {
      return res.status(400).json({ message: "Mağaza adı zorunludur." });
    }

    const userId = req.user._id;

    const existingApplication = await SellerApplication.findOne({
      user: userId,
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "Zaten mevcut bir satıcı başvurunuz bulunmaktadır." });
    }

    const application = await SellerApplication.create({
      user: userId,
      storeName: storeName,
      shippingAddress: shippingAddress,
    });

    res.status(201).json({
      message:
        "Başvurunuz başarıyla oluşturulmuştur. İncelendikten sonra geri bildirim alacaksınız.",
      data: application,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPendingApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.find({
      status: "pending",
    }).populate("user", "name email username");

    res.status(201).json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.find({}).populate(
      "user",
      "name email username"
    );

    res.status(201).json(applications);
  } catch (err) {
    res.status(500).json({ messsage: err.message });
  }
};

export const deleteApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await SellerApplication.findByIdAndDelete(id);

    if (!application)
      return res.status(404).json({ message: "Böyle bir başvuru bulunamadı" });

    res.status(201).json({
      message: "İlgili başvuru başarıyla silinmiştir",
      data: application,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Geçersiz status değeri gönderildi!" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const application = await SellerApplication.findById(id).session(session);

    if (!application) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Böyle bir başvuru bulunamadı" });
    }

    if (application.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(409)
        .json({ message: "Bu başvuru üzerinde zaten işlem yapılmış." });
    }

    if (status === "approved") {
      const userToUpgrade = await User.findById(application.user).session(
        session
      );

      if (!userToUpgrade) {
        throw new Error("Başvuruya ait kullanıcı sistemde bulunamadı.");
      }

      const payload = {
        name: userToUpgrade.name,
        surname: userToUpgrade.surname,
        username: userToUpgrade.username,
        email: userToUpgrade.email,
        password: userToUpgrade.password,
        role: "Seller",
        storeName: application.storeName,
        sellerId: uuidv4(),
      };

      await Seller.create([payload], { session });
      await User.findByIdAndDelete(application.user).session(session);
    } else if (status === "rejected") {
      await User.findByIdAndDelete(application.user).session(session);
    }
    application.status = status;
    await application.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: `İlgili başvuru başarıyla '${status}' olarak güncellendi`,
    });
  } catch (err) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "İşlem sırasında bir hata oluştu: " + err.message });
  } finally {
    session.endSession();
  }
};
