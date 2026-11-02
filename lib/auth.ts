import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import { db, type User } from "./db";
import { isAdminEmail } from "./config";

const SESSION_COOKIE = "ss_session";
const SESSION_DAYS = 90;
export const LOGIN_TOKEN_MINUTES = 15;

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createLoginToken(userId: ObjectId): Promise<string> {
  const { loginTokens } = await db();
  const token = newToken();
  const now = new Date();
  await loginTokens.insertOne({
    tokenHash: hash(token),
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  return token;
}

/** True when a link was sent to this user in the last minute (stops repeat-click spam). */
export async function recentlySentLink(userId: ObjectId): Promise<boolean> {
  const { loginTokens } = await db();
  const since = new Date(Date.now() - 60_000);
  return (await loginTokens.countDocuments({ userId, createdAt: { $gt: since } })) > 0;
}

/**
 * Returns the user id for a valid, unexpired login token. The token stays usable until it
 * expires, so mail scanners that open links in advance don't burn it before the person clicks.
 */
export async function verifyLoginToken(token: string): Promise<ObjectId | null> {
  const { loginTokens } = await db();
  const doc = await loginTokens.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } });
  return doc?.userId ?? null;
}

export async function startSession(userId: ObjectId): Promise<void> {
  const { sessions, users } = await db();
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await sessions.insertOne({ tokenHash: hash(token), userId, expiresAt });
  await users.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const { sessions } = await db();
    await sessions.deleteOne({ tokenHash: hash(token) });
  }
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { sessions, users } = await db();
  const session = await sessions.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return users.findOne({ _id: session.userId });
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
