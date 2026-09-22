import User from "../models/userModel.js";
import { errorHandler } from "./error.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, "You must be signed in."));
    }

    const user = await User.findById(req.user.id).select("isAdmin");

    if (!user) {
      return next(errorHandler(404, "User not found."));
    }

    if (user.isAdmin !== true) {
      return next(errorHandler(403, "Access denied. Admin only."));
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};
