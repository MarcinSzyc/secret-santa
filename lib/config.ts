import "server-only";
import { headers } from "next/headers";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${name} (zobacz .env.example)`);
  return value;
}

export const config = {
  mongoUri: () => required("MONGODB_URI"),
  mongoDb: () => process.env.MONGODB_DB || "secret-santa",
  gmailUser: () => required("GMAIL_USER"),
  gmailAppPassword: () => required("GMAIL_APP_PASSWORD"),
  eventName: () => process.env.EVENT_NAME || "Secret Santa",
  eventBudget: () => process.env.EVENT_BUDGET || "",
  eventDate: () => process.env.EVENT_DATE || "",
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
  return admins.includes(normalizeEmail(email));
}

/** Public base URL for links in emails: APP_URL, else the current request's host. */
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
