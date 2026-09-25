import User from "../models/userModel.js";
import Listing from "../models/listingModel.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";

export const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalListings, activeListings] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({}),
    ]);

    res.status(200).json({
      totalUsers,
      totalListings,
      activeListings,
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

/*
=========================================================
CREATE CLIENT
=========================================================
*/

export const createAdminClient = async (req, res, next) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    if (!username || !email || !password || !phoneNumber) {
      return next(
        errorHandler(
          400,
          "Username, email, password, and phone number are required."
        )
      );
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return next(
        errorHandler(409, "Username or email is already registered.")
      );
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      isAdmin: false,
    });

    const { password: pass, ...safeUser } = newUser.toObject();

    res.status(201).json({
      success: true,
      message: "Client created successfully.",
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
DELETE USER
=========================================================
*/

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

    res.status(200).json({
      success: true,
      message: "User and their listings were deleted.",
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
MAKE ADMIN / REMOVE ADMIN
=========================================================
*/

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

/*
=========================================================
GET ALL LISTINGS
=========================================================
*/

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

/*
=========================================================
CREATE PROPERTY FOR CLIENT
=========================================================
*/

export const createAdminListing = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      city,
      state,
      pincode,
      phoneNumber,
      type,
      propertyType,
      regularPrice,
      negotiable,
      leaseYears,
      sqft,
      bedrooms,
      bathrooms,
      basicAmenities,
      luxuryAmenities,
      imageUrls,
      latitude,
      longitude,
      userRef,
    } = req.body;

    if (!userRef) {
      return next(errorHandler(400, "Please select a client."));
    }

    const client = await User.findById(userRef);

    if (!client) {
      return next(errorHandler(404, "Selected client was not found."));
    }

    if (!name || !description || !address || !phoneNumber) {
      return next(
        errorHandler(
          400,
          "Property name, description, address, and phone number are required."
        )
      );
    }

    if (!["sale", "rent", "lease"].includes(type)) {
      return next(errorHandler(400, "Select a valid listing type."));
    }

    if (
      ![
        "Apartment",
        "Independent House",
        "Commercial Property",
        "Plot",
      ].includes(propertyType)
    ) {
      return next(errorHandler(400, "Select a valid property type."));
    }

    if (type === "lease") {
      const years = Number(leaseYears);

      if (!Number.isInteger(years) || years < 1 || years > 99) {
        return next(
          errorHandler(
            400,
            "Lease duration must be a whole number between 1 and 99 years."
          )
        );
      }
    }

    if (sqft !== undefined && sqft !== "" && Number(sqft) <= 0) {
      return next(
        errorHandler(400, "Property area must be a positive number.")
      );
    }

    const listing = await Listing.create({
      name,
      description,
      address,
      city,
      state,
      pincode,
      phoneNumber,
      type,
      propertyType,
      regularPrice,
      negotiable: negotiable === true || negotiable === "true",
      leaseYears:
        type === "lease" && leaseYears !== ""
          ? Number(leaseYears)
          : null,
      sqft: sqft !== "" && sqft !== undefined ? Number(sqft) : null,
      bedrooms: bedrooms !== "" && bedrooms !== undefined ? Number(bedrooms) : 0,
      bathrooms:
        bathrooms !== "" && bathrooms !== undefined ? Number(bathrooms) : 0,
      basicAmenities: Array.isArray(basicAmenities) ? basicAmenities : [],
      luxuryAmenities: Array.isArray(luxuryAmenities) ? luxuryAmenities : [],
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      latitude:
        latitude !== "" && latitude !== undefined ? Number(latitude) : null,
      longitude:
        longitude !== "" && longitude !== undefined ? Number(longitude) : null,

      // The property belongs to the selected client.
      userRef: client._id,

      // No approval required.
      // New properties are immediately visible on the website.
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully.",
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
DELETE PROPERTY
=========================================================
*/

export const deleteAdminListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found."));
    }

    res.status(200).json({
      success: true,
      message: "Listing deleted.",
    });
  } catch (error) {
    next(error);
  }
};
