import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "cd_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** Mot de passe d'administration, défini dans la variable d'environnement ADMIN_PASSWORD. */
export function getAdminPassword() {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value ? value : undefined;
}

function equals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isValidPassword(candidate: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return equals(candidate, expected);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Jeton de session signé avec le mot de passe : changer le mot de passe invalide les sessions. */
export function createSessionToken() {
  const secret = getAdminPassword();
  if (!secret) return null;
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function isValidSessionToken(token: string | undefined) {
  const secret = getAdminPassword();
  if (!secret || !token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;
  return equals(signature, sign(expiresAt, secret));
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
