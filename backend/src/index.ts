import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import requirementRoutes from "./routes/requirements";
import calculatorRoutes from "./routes/calculator";
import enquiryRoutes from "./routes/enquiries";
import tenderRoutes from "./routes/tenders";
import adminRoutes from "./routes/admin";
import rooftopRoutes from "./routes/rooftop";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(",") 
  : ["http://localhost:5173", "http://localhost:3000", "https://electricitybazaar.in"];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => o.trim() === origin || origin.endsWith("netlify.app"))) {
      return callback(null, true);
    }
    return callback(null, true); // Dev permissive
  },
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/api/v1/health") {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${_res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health Probes
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Electricity Bazaar API",
    version: "1.0.0"
  });
});

app.get("/api/v1/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "unready", database: "disconnected" });
  }
});

// API Routes mount
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/requirements", requirementRoutes);
app.use("/api/v1/calculator", calculatorRoutes);
app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1", tenderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/rooftop", rooftopRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Endpoint ${req.method} ${req.path} not found` }
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: { code: "PAYLOAD_TOO_LARGE", message: "Uploaded bill file is too large (maximum 50MB allowed)." }
    });
  }
  console.error("Unhandled error:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  return res.status(status).json({
    success: false,
    error: { code: err.code || "INTERNAL_ERROR", message: err.message || "An unexpected error occurred" }
  });
});

// Only listen if executed directly
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`⚡ Electricity Bazaar Backend API running on port ${PORT}`);
    console.log(`🌍 Health check available at: http://localhost:${PORT}/api/v1/health`);
  });
}

export default app;
