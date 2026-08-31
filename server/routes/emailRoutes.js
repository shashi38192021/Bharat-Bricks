import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/send-verification-email", async (req, res) => {
  const { listingDetails } = req.body;

  if (!listingDetails) {
    return res.status(400).json({ message: "Listing details are required" });
  }

  // Admin email where verification requests are sent
  const adminEmail = "harishiva760@gmail.com";

  // Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email from .env
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  // Email Content
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: "New Listing Verification Request",
    html: `
      <h2>New Listing Verification Request</h2>
      <p><strong>Name:</strong> ${listingDetails.name}</p>
      <p><strong>Address:</strong> ${listingDetails.address}</p>
      <p><strong>Price:</strong> ₹${listingDetails.regularPrice}</p>
      <p>Please approve or reject the listing.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Verification email sent!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

export default router;
