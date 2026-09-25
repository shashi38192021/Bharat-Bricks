import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { verifyAdmin } from "../utils/adminMiddleware.js";

import {
  createAdminClient,
  createAdminListing,
  deleteAdminListing,
  deleteAdminUser,
  getAllListings,
  getAllUsers,
  getStats,
  toggleAdminStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/test", verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({ message: "Admin access working!" });
});

router.get("/stats", verifyToken, verifyAdmin, getStats);

router.get("/users", verifyToken, verifyAdmin, getAllUsers);

router.post("/users/create", verifyToken, verifyAdmin, createAdminClient);

router.delete(
  "/users/:id",
  verifyToken,
  verifyAdmin,
  deleteAdminUser
);

router.patch(
  "/users/:id/admin",
  verifyToken,
  verifyAdmin,
  toggleAdminStatus
);

router.get("/listings", verifyToken, verifyAdmin, getAllListings);

router.post(
  "/listings/create",
  verifyToken,
  verifyAdmin,
  createAdminListing
);

router.delete(
  "/listings/:id",
  verifyToken,
  verifyAdmin,
  deleteAdminListing
);

export default router;