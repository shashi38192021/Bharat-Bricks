import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import dns from "node:dns";
import express from "express";
import mongoose from "mongoose";
import path from "path";

import userRouter from "../server/routes/userRoute.js";
import authRouter from "../server/routes/authRoute.js";
import listingRouter from "../server/routes/listingRoute.js";
import adminRouter from "../server/routes/adminRoute.js";
import employeeRequestRouter from "../server/routes/employeeRequestRoute.js";
import uploadRouter from "../server/routes/uploadRoute.js";
import emailRouter from "../server/routes/emailRoutes.js";

const app = express();
const __dirname = path.resolve();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/api/upload", (req, res, next) => {
  console.log("[API] /api/upload request received", {
    method: req.method,
    originalUrl: req.originalUrl,
    contentType: req.headers["content-type"],
  });
  next();
});

// API Routes
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/employee", employeeRequestRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/email", emailRouter);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API route not found: ${req.originalUrl}`,
  });
});

// app.use(express.static(path.join(__dirname, "/client/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
// });

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const connectToDatabase = async () => {
  if (!process.env.MONGO_URI) {
    console.error(
      "MongoDB connection skipped: MONGO_URI is missing. Add MONGO_URI to the root .env file."
    );
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

const startServer = async () => {
  await connectToDatabase();

  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
};

startServer();

export default app;