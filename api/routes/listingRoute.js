import express from "express";

import {
  createListing,
  deleteListing,
  getListigs,
  getListing,
  updateListing,
  getUserListings,
  updateListingActivity,
  getMyActivity,
} from "../controllers/listingController.js";

import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

/*
=========================================================
CREATE
=========================================================
*/

router.post(
  "/create",
  verifyToken,
  createListing
);

/*
=========================================================
DELETE
=========================================================
*/

router.delete(
  "/delete/:id",
  verifyToken,
  deleteListing
);

/*
=========================================================
UPDATE
=========================================================
*/

router.post(
  "/update/:id",
  verifyToken,
  updateListing
);

/*
=========================================================
GET SINGLE LISTING
=========================================================
*/

router.get(
  "/get/:id",
  verifyToken,
  getListing
);

/*
=========================================================
GET USER LISTINGS
=========================================================
*/

router.get(
  "/user/:id",
  verifyToken,
  getUserListings
);

/*
=========================================================
GET MY ACTIVITY
=========================================================
*/

router.get(
  "/my-activity",
  verifyToken,
  getMyActivity
);

/*
=========================================================
GET ALL LISTINGS
=========================================================
*/

router.get(
  "/get",
  getListigs
);

/*
=========================================================
PROPERTY ACTIVITY
=========================================================
*/

router.post(
  "/activity/:id",
  verifyToken,
  updateListingActivity
);

export default router;