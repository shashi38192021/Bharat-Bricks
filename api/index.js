import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import userRouter from "../server/routes/userRoute.js";
import authRouter from "../server/routes/authRoute.js";
import listingRouter from "../server/routes/listingRoute.js";
import uploadRouter from "../server/routes/uploadRoute.js";
import cookieParser from "cookie-parser";
import emailRouter from "../server/routes/emailRoutes.js";
import path from "path";

dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("DNS Servers:", dns.getServers());

const __dirname = path.resolve();

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
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

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);
app.use("/api/upload", uploadRouter);

app.use("/api/email", emailRouter);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API route not found: ${req.originalUrl}`,
  });
});

//app.use(express.static(path.join(__dirname, "/client/dist")));

//app.get("*", (req, res) => {
//  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
//});

// middleware

app.use((err, req, res, next) => {
  console.error("[API] Error response", {
    path: req.originalUrl,
    name: err.name,
    code: err.code,
    message: err.message,
    http_code: err.http_code,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error!";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

export default app;