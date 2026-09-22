import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { verifyAdmin } from "../utils/adminMiddleware.js";
import {
  deleteAdminListing,
  deleteAdminUser,
  getAllListings,
  getAllUsers,
  getStats,
  toggleAdminStatus,
  toggleListingApproval,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/test", verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({ message: "Admin access working!" });
});

router.get("/stats", verifyToken, verifyAdmin, getStats);
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, deleteAdminUser);
router.patch("/users/:id/admin", verifyToken, verifyAdmin, toggleAdminStatus);
router.get("/listings", verifyToken, verifyAdmin, getAllListings);
router.delete("/listings/:id", verifyToken, verifyAdmin, deleteAdminListing);
router.put(
  "/listings/approve/:id",
  verifyToken,
  verifyAdmin,
  toggleListingApproval
);

export default router;
