import EmployeeRequest from "../models/employeeRequestModel.js";
import User from "../models/userModel.js";
import { errorHandler } from "../utils/error.js";

export const createEmployeeRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(errorHandler(404, "User not found."));
    }

    if (user.isAdmin === true) {
      return next(errorHandler(400, "Admins do not need employee approval."));
    }

    if (user.role !== "employee") {
      return next(errorHandler(400, "Only employees can request permission."));
    }

    if (user.employeeApproved === true) {
      return next(errorHandler(400, "Employee account is already approved."));
    }

    const existingRequest = await EmployeeRequest.findOne({
      employee: user._id,
      status: "pending",
    });

    if (existingRequest) {
      return next(
        errorHandler(400, "Your employee permission request is already pending.")
      );
    }

    const request = await EmployeeRequest.create({
      employee: user._id,
      status: "pending",
    });

    user.employeeRequestPending = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Employee permission request sent to admin.",
      request,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeRequests = async (req, res, next) => {
  try {
    const requests = await EmployeeRequest.find({
      status: "pending",
    })
      .populate(
        "employee",
        "username email phoneNumber avatar role createdAt employeeApproved employeeRequestPending"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

export const approveEmployeeRequest = async (req, res, next) => {
  try {
    const request = await EmployeeRequest.findById(req.params.id);

    if (!request) {
      return next(errorHandler(404, "Employee request not found."));
    }

    if (request.status !== "pending") {
      return next(errorHandler(400, "This request has already been reviewed."));
    }

    const employee = await User.findById(request.employee);

    if (!employee) {
      return next(errorHandler(404, "Employee account not found."));
    }

    employee.role = "employee";
    employee.employeeApproved = true;
    employee.employeeRequestPending = false;

    await employee.save();

    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: "Employee approved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const rejectEmployeeRequest = async (req, res, next) => {
  try {
    const request = await EmployeeRequest.findById(req.params.id);

    if (!request) {
      return next(errorHandler(404, "Employee request not found."));
    }

    if (request.status !== "pending") {
      return next(errorHandler(400, "This request has already been reviewed."));
    }

    const employee = await User.findById(request.employee);

    if (employee) {
      employee.employeeApproved = false;
      employee.employeeRequestPending = false;
      await employee.save();
    }

    request.status = "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: "Employee request rejected.",
    });
  } catch (error) {
    next(error);
  }
};