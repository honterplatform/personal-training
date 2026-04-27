import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import { clerkAuth, requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import trackerRoutes from "./routes/trackers.js";
import entryRoutes from "./routes/entries.js";
import coachRoutes from "./routes/coach.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true }));
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Clerk middleware reads the Authorization Bearer token (or session cookie),
// verifies the JWT, and attaches auth info to the request. requireAuth then
// lazy-creates the matching User row in our DB.
app.use(clerkAuth());

app.use("/api/auth", authRoutes);
app.use("/api/trackers", requireAuth, trackerRoutes);
app.use("/api/entries", requireAuth, entryRoutes);
app.use("/api/coach", requireAuth, coachRoutes);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

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
