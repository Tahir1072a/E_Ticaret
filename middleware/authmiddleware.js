import jwt from "jsonwebtoken";
import { User } from "../models/usersModel.js";

export const protect = async (req, res, next) => {
  let token;
  // console.log(req.headers);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (err) {
      console.log(err);
      res.status(401).json({ message: "Yetkiniz yok!, token geçersiz." });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Yetkiniz yok, token bulunamadı." });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bu işlemi yapmak için yetkinmiz yok!",
      });
    }
    next();
  };
};
