import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { startSession, verifyLoginToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = token ? await verifyLoginToken(token) : null;
  if (!userId) redirect("/login?error=link");
  await startSession(userId);
  redirect("/");
}
