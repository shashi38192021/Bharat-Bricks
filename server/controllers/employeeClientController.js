import User from "../models/userModel.js";
import EmployeeActivity from "../models/employeeActivityModel.js";
import { errorHandler } from "../utils/error.js";

export const createEmployeeClient = async (req, res, next) => {
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
      username,
      email,
      phoneNumber,
      password,
    } = req.body;

    if (!username || !email || !phoneNumber || !password) {
      return next(
        errorHandler(
          400,
          "Username, email, phone number and password are required."
        )
      );
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return next(
        errorHandler(400, "Username or email is already registered.")
      );
    }

    const client = await User.create({
      username,
      email,
      phoneNumber,
      password,
      role: "user",
      isAdmin: false,
      employeeApproved: false,
      employeeRequestPending: false,
      createdByEmployee: employee._id,
    });

    await EmployeeActivity.create({
      employee: employee._id,
      activityType: "client_added",
      client: client._id,
      notes: `Client ${client.username} was added by employee ${employee.username}.`,
    });

    const safeClient = {
      _id: client._id,
      username: client.username,
      email: client.email,
      phoneNumber: client.phoneNumber,
      role: client.role,
      createdByEmployee: client.createdByEmployee,
      createdAt: client.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Client added successfully.",
      client: safeClient,
    });
  } catch (error) {
    next(error);
  }
};