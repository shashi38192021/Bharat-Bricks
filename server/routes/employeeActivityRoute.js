import express from "express";
import { verifyToken } from "../utils/verifyUser.js";

import {
  createEmployeeActivity,
  getMyEmployeeActivities,
  getEmployeeStats,
} from "../controllers/employeeActivityController.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  createEmployeeActivity
);

router.get(
  "/",
  verifyToken,
  getMyEmployeeActivities
);

router.get(
  "/stats",
  verifyToken,
  getEmployeeStats
);

export default router;