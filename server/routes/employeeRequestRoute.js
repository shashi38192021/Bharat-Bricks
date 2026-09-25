import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { verifyAdmin } from "../utils/adminMiddleware.js";

import {
  createEmployeeRequest,
  getEmployeeRequests,
  approveEmployeeRequest,
  rejectEmployeeRequest,
} from "../controllers/employeeRequestController.js";

const router = express.Router();

// Employee sends Admin Permit request
router.post(
  "/request",
  verifyToken,
  createEmployeeRequest
);

// Admin views pending employee requests
router.get(
  "/requests",
  verifyToken,
  verifyAdmin,
  getEmployeeRequests
);

// Admin approves employee
router.patch(
  "/requests/:id/approve",
  verifyToken,
  verifyAdmin,
  approveEmployeeRequest
);

// Admin rejects employee
router.patch(
  "/requests/:id/reject",
  verifyToken,
  verifyAdmin,
  rejectEmployeeRequest
);

export default router;