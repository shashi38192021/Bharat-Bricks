import Listing from "../models/listingModel.js";
import { errorHandler } from "../utils/error.js";

const validateListingData = (body) => {
  if (!body.phoneNumber?.trim()) {
    return "Phone number is required!";
  }

  if (
    ![
      "Apartment",
      "Independent House",
      "Commercial Property",
      "Plot",
    ].includes(body.propertyType)
  ) {
    return "Select a valid property type.";
  }

  if (!["sale", "rent", "lease"].includes(body.type)) {
    return "Select a valid listing type.";
  }

  if (body.type === "lease") {
    const years = Number(body.leaseYears);

    if (
      !Number.isInteger(years) ||
      years < 1 ||
      years > 99
    ) {
      return "Lease duration must be a whole number between 1 and 99 years.";
    }
  }

  if (
    body.sqft !== undefined &&
    body.sqft !== "" &&
    Number(body.sqft) <= 0
  ) {
    return "Property area must be a positive number.";
  }

  return null;
};

/*
=========================================================
CREATE LISTING
=========================================================
*/

export const createListing = async (req, res, next) => {
  try {
    const validationError = validateListingData(req.body);

    if (validationError) {
      return next(errorHandler(400, validationError));
    }

    const listing = await Listing.create({
      ...req.body,
      userRef: req.user.id,

      // New listings start with empty activity
      activity: {
        likedBy: [],
        savedBy: [],
        wantedToVisitBy: [],
        visitedBy: [],
        finalizedBy: [],
      },
    });

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
DELETE LISTING
=========================================================
*/

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    if (req.user.id.toString() !== listing.userRef.toString()) {
      return next(
        errorHandler(
          401,
          "You can only delete your own listing!"
        )
      );
    }

    await Listing.findByIdAndDelete(req.params.id);

    return res.status(200).json(
      "Listing has been deleted!"
    );
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
UPDATE LISTING
=========================================================
*/

export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    if (req.user.id.toString() !== listing.userRef.toString()) {
      return next(
        errorHandler(
          401,
          "You can only update your own listing!"
        )
      );
    }

    const validationError = validateListingData(req.body);

    if (validationError) {
      return next(errorHandler(400, validationError));
    }

    /*
     * Do not allow frontend to overwrite activity.
     * Activity is controlled only by the activity API.
     */
    const updateData = { ...req.body };
    delete updateData.activity;
    delete updateData.userRef;

    const updatedListing =
      await Listing.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET SINGLE LISTING
=========================================================
*/

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    const userId = req.user.id;

    const activity = listing.activity || {
      likedBy: [],
      savedBy: [],
      wantedToVisitBy: [],
      visitedBy: [],
      finalizedBy: [],
    };

    const userActivity = {
      liked: activity.likedBy?.some(
        (user) =>
          user.toString() === userId.toString()
      ) || false,

      saved: activity.savedBy?.some(
        (user) =>
          user.toString() === userId.toString()
      ) || false,

      wantedToVisit: activity.wantedToVisitBy?.some(
        (user) =>
          user.toString() === userId.toString()
      ) || false,

      visited: activity.visitedBy?.some(
        (user) =>
          user.toString() === userId.toString()
      ) || false,

      finalized: activity.finalizedBy?.some(
        (user) =>
          user.toString() === userId.toString()
      ) || false,
    };

    const activityCounts = {
      likes: activity.likedBy?.length || 0,
      saves: activity.savedBy?.length || 0,
      wantedToVisit:
        activity.wantedToVisitBy?.length || 0,
      visited: activity.visitedBy?.length || 0,
      finalized:
        activity.finalizedBy?.length || 0,
    };

    return res.status(200).json({
      ...listing.toObject(),
      userActivity,
      activityCounts,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET ALL LISTINGS
=========================================================
*/

export const getListigs = async (req, res, next) => {
  try {
    const limit =
      parseInt(req.query.limit) || 9;

    const startIndex =
      parseInt(req.query.startIndex) || 0;

    const type =
      req.query.type === undefined ||
      req.query.type === "all"
        ? {
            $in: [
              "sale",
              "rent",
              "lease",
            ],
          }
        : req.query.type;

    const searchTerm =
      req.query.searchTerm || "";

    const sortField =
      req.query.sort || "createdAt";

    const sortOrder =
      req.query.order || "desc";

    const listings = await Listing.find({
      type,

      $or: [
        {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
        },

        {
          address: {
            $regex: searchTerm,
            $options: "i",
          },
        },

        {
          propertyType: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ],
    })
      .sort({
        [sortField]: sortOrder,
      })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET USER LISTINGS
=========================================================
*/

export const getUserListings = async (
  req,
  res,
  next
) => {
  try {
    const listings = await Listing.find({
      userRef: req.params.id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
UPDATE PROPERTY ACTIVITY
=========================================================
*/

export const updateListingActivity = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { activity } = req.body;
    const userId = req.user.id;

    const allowedActivities = {
      like: "likedBy",
      save: "savedBy",
      wantedToVisit: "wantedToVisitBy",
      visited: "visitedBy",
      finalized: "finalizedBy",
    };

    const activityField =
      allowedActivities[activity];

    if (!activityField) {
      return next(
        errorHandler(
          400,
          "Invalid activity."
        )
      );
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return next(
        errorHandler(
          404,
          "Listing not found!"
        )
      );
    }

    /*
     * Make sure old listings that don't have
     * activity yet can still use this feature.
     */
    if (!listing.activity) {
      listing.activity = {
        likedBy: [],
        savedBy: [],
        wantedToVisitBy: [],
        visitedBy: [],
        finalizedBy: [],
      };
    }

    if (!listing.activity[activityField]) {
      listing.activity[activityField] = [];
    }

    const users =
      listing.activity[activityField];

    const alreadyActive = users.some(
      (user) =>
        user.toString() ===
        userId.toString()
    );

    if (alreadyActive) {
      listing.activity[activityField] =
        users.filter(
          (user) =>
            user.toString() !==
            userId.toString()
        );
    } else {
      listing.activity[activityField].push(
        userId
      );
    }

    await listing.save();

    return res.status(200).json({
      success: true,

      activity,

      active: !alreadyActive,

      counts: {
        likes:
          listing.activity.likedBy?.length ||
          0,

        saves:
          listing.activity.savedBy?.length ||
          0,

        wantedToVisit:
          listing.activity
            .wantedToVisitBy?.length || 0,

        visited:
          listing.activity.visitedBy?.length ||
          0,

        finalized:
          listing.activity.finalizedBy?.length ||
          0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET MY ACTIVITY
=========================================================
*/

export const getMyActivity = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    const listings = await Listing.find({
      $or: [
        {
          "activity.likedBy": userId,
        },

        {
          "activity.savedBy": userId,
        },

        {
          "activity.wantedToVisitBy": userId,
        },

        {
          "activity.visitedBy": userId,
        },

        {
          "activity.finalizedBy": userId,
        },
      ],
    }).sort({
      createdAt: -1,
    });

    const activityListings =
      listings.map((listing) => {
        const activity =
          listing.activity || {};

        return {
          ...listing.toObject(),

          userActivity: {
            liked:
              activity.likedBy?.some(
                (user) =>
                  user.toString() ===
                  userId.toString()
              ) || false,

            saved:
              activity.savedBy?.some(
                (user) =>
                  user.toString() ===
                  userId.toString()
              ) || false,

            wantedToVisit:
              activity.wantedToVisitBy?.some(
                (user) =>
                  user.toString() ===
                  userId.toString()
              ) || false,

            visited:
              activity.visitedBy?.some(
                (user) =>
                  user.toString() ===
                  userId.toString()
              ) || false,

            finalized:
              activity.finalizedBy?.some(
                (user) =>
                  user.toString() ===
                  userId.toString()
              ) || false,
          },
        };
      });

    return res.status(200).json(
      activityListings
    );
  } catch (error) {
    next(error);
  }
};