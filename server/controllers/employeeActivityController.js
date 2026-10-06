import EmployeeActivity from "../models/employeeActivityModel.js";
import User from "../models/userModel.js";
import Listing from "../models/listingModel.js";
import { errorHandler } from "../utils/error.js";

const allowedActivities = [
  "client_added",
  "property_added",
  "property_assigned",
  "conversation",
  "sale_closed",
  "rent_closed",
  "lease_closed",
];

export const createEmployeeActivity = async (req, res, next) => {
  try {
    const employee = await User.findById(req.user.id);

    if (!employee) {
      return next(errorHandler(404, "Employee not found."));
    }

    const isApprovedEmployee =
      employee.role === "employee" && employee.employeeApproved === true;

    if (employee.isAdmin !== true && !isApprovedEmployee) {
      return next(errorHandler(403, "Employee dashboard access denied."));
    }

    const {
      activityType,
      client,
      property,
      notes,
    } = req.body;

    if (!allowedActivities.includes(activityType)) {
      return next(errorHandler(400, "Invalid employee activity."));
    }

    if (client) {
      const clientUser = await User.findById(client);

      if (!clientUser) {
        return next(errorHandler(404, "Client not found."));
      }
    }

    if (property) {
      const listing = await Listing.findById(property);

      if (!listing) {
        return next(errorHandler(404, "Property not found."));
      }
    }

    const activity = await EmployeeActivity.create({
      employee: employee._id,
      activityType,
      client: client || null,
      property: property || null,
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Employee activity recorded successfully.",
      activity,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEmployeeActivities = async (req, res, next) => {
  try {
    const employee = await User.findById(req.user.id);

    if (!employee) {
      return next(errorHandler(404, "Employee not found."));
    }

    const isApprovedEmployee =
      employee.role === "employee" && employee.employeeApproved === true;

    if (employee.isAdmin !== true && !isApprovedEmployee) {
      return next(errorHandler(403, "Employee dashboard access denied."));
    }

    const activities = await EmployeeActivity.find({
      employee: employee._id,
    })
      .populate("client", "username email phoneNumber")
      .populate("property", "name type propertyType regularPrice")
      .sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeStats = async (req, res, next) => {
  try {
    const employee = await User.findById(req.user.id);

    if (!employee) {
      return next(errorHandler(404, "Employee not found."));
    }

    const isApprovedEmployee =
      employee.role === "employee" && employee.employeeApproved === true;

    if (employee.isAdmin !== true && !isApprovedEmployee) {
      return next(errorHandler(403, "Employee dashboard access denied."));
    }

    const employeeId = employee._id;

    const [
      clientsAdded,
      propertiesAdded,
      propertiesAssigned,
      saleDealsClosed,
      rentDealsClosed,
      leaseDealsClosed,
      conversations,
    ] = await Promise.all([
      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "client_added",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "property_added",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "property_assigned",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "sale_closed",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "rent_closed",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "lease_closed",
      }),

      EmployeeActivity.countDocuments({
        employee: employeeId,
        activityType: "conversation",
      }),
    ]);

    res.status(200).json({
      clientsAdded,
      propertiesAdded,
      propertiesAssigned,
      saleDealsClosed,
      rentDealsClosed,
      leaseDealsClosed,
      conversations,
      totalDealsClosed:
        saleDealsClosed + rentDealsClosed + leaseDealsClosed,
    });
  } catch (error) {
    next(error);
  }
};