import express from "express";

import {
  signup,
  signin,
  google,
  signout,
  sendSignupOtp,
  verifySignupOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();


// Normal signup
router.post("/signup", signup);


// Send signup OTP
router.post("/send-signup-otp", sendSignupOtp);


// Verify signup OTP and automatically sign in
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/reset", resetPassword);


// Normal sign in
router.post("/signin", signin);


// Google sign in
router.post("/google", google);


// Sign out
router.get("/signout", signout);


export default router;
