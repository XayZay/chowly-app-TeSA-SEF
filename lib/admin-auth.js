import crypto from "crypto";
import { cookies } from "next/headers";
import { query } from "./db";

const COOKIE_NAME = "chowly_admin";
const SESSION_HOURS = 8;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || "chowly-local-admin";
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(":")) return false;

  const [salt, hash] = storedHash.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

export function createSessionValue(username) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${username}.${expires}`;
  const signature = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionValue(value) {
  if (!value) return false;

  const [username, expires, signature] = value.split(".");
  if (!username || !expires || !signature || Number(expires) < Date.now()) return false;

  const payload = `${username}.${expires}`;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function setAdminSession(username) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(username), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }
  return null;
}

export async function findAdmin(username) {
  const { rows } = await query("select username, password_hash from admin_user where username = $1", [username]);
  return rows[0] || null;
}
