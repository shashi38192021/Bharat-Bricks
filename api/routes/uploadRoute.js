import express from "express";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/uploadMiddleware.js";
import { errorHandler } from "../utils/error.js";

const router = express.Router();

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    console.log("[Upload route] Sending buffer to Cloudinary", {
      bufferExists: Boolean(fileBuffer),
      bufferBytes: fileBuffer?.length,
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "bharat-bricks/listings" },
      (error, result) => {
        if (error) {
          console.error("[Upload route] Cloudinary upload failed", error);
          reject(error);
        } else {
          console.log("[Upload route] Cloudinary upload succeeded", {
            publicId: result.public_id,
            secureUrl: result.secure_url,
            bytes: result.bytes,
            format: result.format,
          });
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const uploadSingleImage = (req, res, next) => {
  console.log("[Upload route] /api/upload reached before multer", {
    method: req.method,
    contentType: req.headers["content-type"],
    contentLength: req.headers["content-length"],
  });

  upload.single("image")(req, res, (error) => {
    if (error) {
      console.error("[Upload route] Multer failed", {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
      });

      if (error.code === "LIMIT_FILE_SIZE") {
        return next(errorHandler(400, "Image must be smaller than 10 MB."));
      }

      return next(errorHandler(400, error.message || "Image upload failed."));
    }

    console.log("[Upload route] Multer completed", {
      fileExists: Boolean(req.file),
      file: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferExists: Boolean(req.file.buffer),
            bufferBytes: req.file.buffer?.length,
          }
        : null,
    });

    next();
  });
};

router.post("/", uploadSingleImage, async (req, res, next) => {
  try {
    console.log("[Upload route] Handling Cloudinary upload");

    if (!req.file) {
      console.log("[Upload route] req.file is missing");
      return next(errorHandler(400, "Image file is required."));
    }

    const result = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      secure_url: result.secure_url,
    });
  } catch (error) {
    console.error("[Upload route] Upload handler failed", {
      name: error.name,
      message: error.message,
      http_code: error.http_code,
      stack: error.stack,
    });
    next(error);
  }
});

export default router;
