import { jwtVerify, createRemoteJWKSet } from "jose";
import { OAuth2Client } from "google-auth-library";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/**
 * Verify an Apple ID token returned by the native Sign in with Apple flow.
 * @param identityToken JWT from Apple
 * @param expectedAudience the iOS bundle id (e.g. com.honterplatform.log) — for native flows audience equals the bundle id
 */
export async function verifyAppleIdToken(identityToken, expectedAudience) {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: expectedAudience,
  });
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === "true" || payload.email_verified === true,
  };
}

let googleClient = null;
function getGoogleClient() {
  if (!googleClient) googleClient = new OAuth2Client();
  return googleClient;
}

/**
 * Verify a Google ID token returned by the native Google Sign-In SDK on iOS.
 * @param idToken JWT from Google
 * @param expectedAudiences array of accepted audiences (your iOS client id, web client id, etc.)
 */
export async function verifyGoogleIdToken(idToken, expectedAudiences) {
  const ticket = await getGoogleClient().verifyIdToken({
    idToken,
    audience: expectedAudiences,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error("invalid google token");
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name,
  };
}
