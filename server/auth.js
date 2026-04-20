import crypto from "crypto";

const COOKIE_NAME = "log_auth";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function sign(value, secret) {
  const hmac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(token, secret) {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function issueCookie(res) {
  const secret = process.env.COOKIE_SECRET;
  const issuedAt = Date.now().toString();
  const token = sign(issuedAt, secret);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function requireAuth(req, res, next) {
  const secret = process.env.COOKIE_SECRET;
  const token = req.cookies?.[COOKIE_NAME];
  if (!verify(token, secret)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const idx = token.lastIndexOf(".");
  const issuedAt = Number(token.slice(0, idx));
  if (!issuedAt || Date.now() - issuedAt > MAX_AGE_MS) {
    return res.status(401).json({ error: "expired" });
  }
  next();
}
