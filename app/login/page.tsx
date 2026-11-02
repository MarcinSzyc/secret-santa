import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { GiftIcon } from "@/components/icons";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="login-wrap">
      <div className="brand" style={{ fontSize: 24 }}>
        <GiftIcon size={28} />
        <span>{config.eventName()}</span>
      </div>
      <div className="login-card">
        <LoginForm linkError={error === "link"} />
      </div>
    </div>
  );
}
