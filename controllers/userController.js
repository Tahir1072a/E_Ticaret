import { User, Admin, Seller, Customer } from "../models/usersModel.js";
import bcrypt from "bcryptjs";
import APIFeatures from "../utils/apiFeatures.js";

export async function createHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
}

export const createUser = async (req, res) => {
  try {
    const { email, username } = req.body;

    const userExistWithUsername = await User.findOne({ username: username });
    const userExistsWithEmail = await User.findOne({ email: email });

    if (userExistsWithEmail) {
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
    const role = userData.role || "Customer";

    userData.password = await createHash(userData.password);

    switch (role) {
      case "Admin":
        newUser = await Admin.create(userData);
        break;
      case "Seller":
        newUser = await Seller.create(userData);
        break;
      default:
        newUser = await Customer.create(userData);
    }

    res.status(201).json({
      message: `${
        role || "Customer"
      } rölüyle yeni kullanıcı kayıt işlemi başarıyla tamamlandı.`,
      data: newUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query.populate({
      path: "wishlist",
      populate: {
        path: "baseProduct",
        select: "masterName masterCategory",
      },
    });

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ message: `Bu Id ye ait kullanıcı bulunamadı: ${id}` });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllSeller = async (req, res) => {
  try {
    const sellers = await Seller.find({}).lean();

    res.status(200).json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res
        .status(404)
        .json({ message: `Bu email'e sahip kullanıcı bulunamadı: ${email}` });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: `Bu ID ye ait bir kullanıcı bulunmamaktadır.) ${id}`,
      });
    }

    user.isActive = false;
    await user.save();

    const name = user.name;
    const lastName = user.surname;

    res.status(200).json({
      message: `${name} ${lastName} adlı kullanıcı başarıyla silinmiştir. ID: ${id}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    let user = await User.findById(id);

    if (userData.password) {
      userData.password = await createHash(userData.password);
    }

    user = await User.findByIdAndUpdate(id, userData, { new: true });

    if (!user) {
      return res
        .status(404)
        .json({ message: `Bu ID ye ait bir kullanıcı bulunmamaktadır ${id}` });
    }

    const name = user.name;
    const lastName = user.surname;

    res.status(200).json({
      message: `${name} ${lastName} adlı kullanıcı başarıyla güncellenmiştir. ID: ${id}`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
