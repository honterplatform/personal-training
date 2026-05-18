import "dotenv/config";
import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import { requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import trackerRoutes from "./routes/trackers.js";
import entryRoutes from "./routes/entries.js";
import coachRoutes from "./routes/coach.js";
import weightRoutes from "./routes/weights.js";
import nutritionRoutes from "./routes/nutrition.js";
import templateRoutes from "./routes/templates.js";
import measurementRoutes from "./routes/measurements.js";
import adminRoutes from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true }));
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/trackers", requireAuth, trackerRoutes);
app.use("/api/entries", requireAuth, entryRoutes);
app.use("/api/weights", requireAuth, weightRoutes);
app.use("/api/nutrition", requireAuth, nutritionRoutes);
app.use("/api/templates", requireAuth, templateRoutes);
app.use("/api/measurements", requireAuth, measurementRoutes);
app.use("/api/coach", requireAuth, coachRoutes);
app.use("/api/admin", requireAuth, adminRoutes);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Global error handler — keeps the process alive when a route throws.
app.use((err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err?.message || "internal server error" });
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
  } catch (err) {
    console.error("[server] startup failed:", err);
    process.exit(1);
  }
})();
