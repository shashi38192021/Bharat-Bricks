import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

console.log("[Cloudinary config] Loading Cloudinary configuration", {
  cloudNamePresent: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  apiKeyPresent: Boolean(process.env.CLOUDINARY_API_KEY),
  apiSecretPresent: Boolean(process.env.CLOUDINARY_API_SECRET),
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
