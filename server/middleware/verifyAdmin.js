import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { errorHandler } from "../utils/error.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return next(errorHandler(401, "Please sign in first."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(errorHandler(404, "User not found."));
    }

    if (user.isAdmin !== true) {
      return next(errorHandler(403, "Admin access required."));
    }

    req.user = user;

    next();
  } catch (error) {
    return next(errorHandler(401, "Invalid or expired authentication token."));
  }
};