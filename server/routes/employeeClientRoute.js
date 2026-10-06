import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { createEmployeeClient } from "../controllers/employeeClientController.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  createEmployeeClient
);

export default router;