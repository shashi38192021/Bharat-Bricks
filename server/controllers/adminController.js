import User from "../models/userModel.js";
import Listing from "../models/listingModel.js";
import { errorHandler } from "../utils/error.js";

export const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalListings, activeListings, pendingListings] =
      await Promise.all([
        User.countDocuments(),
        Listing.countDocuments(),
        Listing.countDocuments({ approved: true }),
        Listing.countDocuments({ approved: false }),
      ]);

    res.status(200).json({
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(errorHandler(400, "You cannot delete your own account here."));
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(errorHandler(404, "User not found."));
    }

    await Listing.deleteMany({ userRef: user._id });
    res.status(200).json({ message: "User and their listings were deleted." });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(errorHandler(400, "You cannot change your own admin status."));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(errorHandler(404, "User not found."));
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    const { password, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const getAllListings = async (req, res, next) => {
  try {
    const listings = await Listing.find()
      .populate("userRef", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found."));
    }

    res.status(200).json({ message: "Listing deleted." });
  } catch (error) {
    next(error);
  }
};

export const toggleListingApproval = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found."));
    }

    listing.approved = !listing.approved;
    await listing.save();
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};
