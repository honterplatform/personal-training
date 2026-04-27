import crypto from "crypto";

const COOKIE_NAME = "log_session";
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

function sign(value, secret) {
  const hmac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(token, secret) {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
    if (!ok) return null;
  } catch {
    return null;
  }
  // value is "<userId>.<issuedAt>"
  const [userId, issuedAt] = value.split(".");
  if (!userId || !issuedAt) return null;
  const ms = Number(issuedAt);
  if (!ms || Date.now() - ms > MAX_AGE_MS) return null;
  return { userId, issuedAt: ms };
}

export function issueSession(res, userId) {
  const secret = process.env.COOKIE_SECRET;
  const value = `${userId}.${Date.now()}`;
  const token = sign(value, secret);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(req, res, next) {
  const secret = process.env.COOKIE_SECRET;
  const token = req.cookies?.[COOKIE_NAME];
  const session = verify(token, secret);
  if (!session) return res.status(401).json({ error: "unauthorized" });
  req.userId = session.userId;
  next();
}

export function readSession(req) {
  const secret = process.env.COOKIE_SECRET;
  return verify(req.cookies?.[COOKIE_NAME], secret);
}
