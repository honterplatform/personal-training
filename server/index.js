import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import { requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import entriesRoutes from "./routes/entries.js";
import summaryRoutes from "./routes/summary.js";
import coachRoutes from "./routes/coach.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.use("/api/auth", authRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/entries", requireAuth, entriesRoutes);
app.use("/api/summary", requireAuth, summaryRoutes);
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
    app.listen(PORT, () => {
      console.log(`[server] listening on ${PORT}`);
    });
  } catch (err) {
    console.error("[server] startup failed:", err);
    process.exit(1);
  }
})();
