import { createHash, randomBytes } from "crypto";

export const AUTH_SESSION_COOKIE = "customer_auth_session";
export const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function createPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + AUTH_SESSION_TTL_MS);
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
}

export function getSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}
