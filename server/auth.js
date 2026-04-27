import { clerkMiddleware, getAuth, createClerkClient } from "@clerk/express";
import User from "./models/User.js";

let _clerk = null;
export function clerk() {
  if (_clerk) return _clerk;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY not set");
  _clerk = createClerkClient({ secretKey });
  return _clerk;
}

export function clerkAuth() {
  return clerkMiddleware();
}

/**
 * Pulls the Clerk user id off the request, ensures we have a matching User
 * row in Mongo (lazy-created on first authenticated request), and attaches
 * { req.userId, req.user }.
 */
export async function requireAuth(req, res, next) {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "unauthorized" });

  let user = await User.findById(auth.userId);
  if (!user) {
    let email = "";
    let displayName = "";
    try {
      const cu = await clerk().users.getUser(auth.userId);
      email = cu.emailAddresses?.[0]?.emailAddress || "";
      displayName =
        cu.firstName || cu.lastName
          ? `${cu.firstName || ""} ${cu.lastName || ""}`.trim()
          : cu.username || "";
    } catch (err) {
      console.warn("[clerk] could not fetch user:", err.message);
    }
    user = await User.create({ _id: auth.userId, email, displayName });
  }

  req.userId = auth.userId;
  req.user = user;
  next();
}
