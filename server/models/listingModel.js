import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["sale", "rent", "lease"],
    },

    propertyType: {
      type: String,
      required: true,
      enum: [
        "Apartment",
        "Independent House",
        "Commercial Property",
        "Plot",
      ],
    },

    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    negotiable: {
      type: Boolean,
      default: false,
    },

    leaseYears: {
      type: Number,
      min: 1,
      max: 99,
      default: null,
    },

    sqft: {
      type: Number,
      min: 0,
      default: null,
    },

    bedrooms: {
      type: Number,
      min: 0,
      default: 0,
    },

    bathrooms: {
      type: Number,
      min: 0,
      default: 0,
    },

    basicAmenities: {
      type: [String],
      default: [],
    },

    luxuryAmenities: {
      type: [String],
      default: [],
    },

    imageUrls: {
      type: [String],
      default: [],
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Property Activity
    activity: {
      likedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      savedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      wantedToVisitBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      visitedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      finalizedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
