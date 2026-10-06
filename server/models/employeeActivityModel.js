import mongoose from "mongoose";

const employeeActivitySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    activityType: {
      type: String,
      enum: [
        "client_added",
        "property_added",
        "property_assigned",
        "conversation",
        "sale_closed",
        "rent_closed",
        "lease_closed",
      ],
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const EmployeeActivity = mongoose.model(
  "EmployeeActivity",
  employeeActivitySchema
);

export default EmployeeActivity;