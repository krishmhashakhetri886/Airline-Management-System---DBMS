// import express from "express";
// import cors from "cors";
// import bodyParser from "body-parser";
// import dotenv from "dotenv";

// import { testConnection } from "./db.js";
// import flightsRoutes from "./routes/flights.js";
// import bookingRoutes from "./routes/booking.js";
// import paymentRoutes from "./routes/payment.js";
// import adminRoutes from "./routes/admin.js";

// dotenv.config();

// const app = express();
// const port = Number(process.env.PORT || 5000);

// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use((req, _res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });

// app.get("/health", (_req, res) => {
//   res.json({ ok: true, service: "airline-backend" });
// });

// app.use("/", flightsRoutes);
// app.use("/", bookingRoutes);
// app.use("/", paymentRoutes);
// app.use("/", adminRoutes);

// app.use((req, res) => {
//   res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
// });

// app.use((error, _req, res, _next) => {
//   console.error("Unhandled error:", error);
//   res.status(500).json({
//     error: "Internal server error",
//     details: process.env.NODE_ENV === "development" ? error.message : undefined,
//   });
// });

// (async function startServer() {
//   try {
//     await testConnection();
//     app.listen(port, () => {
//       console.log(`Backend server running on http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error("Database connection failed:", error.message);
//     process.exit(1);
//   }
// })();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { testConnection } from "./db.js";
import authRoutes from "./routes/auth.js";
import flightsRoutes from "./routes/flights.js";
import bookingRoutes from "./routes/booking.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(currentDir, ".env") });

const app = express();
const port = Number(process.env.PORT || 5000);

// ✅ Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "airline-backend" });
});

// ✅ Routes
app.use("/", flightsRoutes);
app.use("/", authRoutes);
app.use("/", bookingRoutes);
app.use("/", paymentRoutes);
app.use("/", adminRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ✅ Error handler
app.use((error, _req, res, _next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
});

// ✅ Start server
(async function startServer() {
  try {
    await testConnection();
    console.log("🚀 Starting backend...");
    app.listen(port, () => {
      console.log(`✅ Backend running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
})();