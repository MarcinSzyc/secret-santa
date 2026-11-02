import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { SantaLogo } from "@/components/SantaLogo";
import { EffectsToggle, ThemeToggle } from "@/components/PrefToggles";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="login-wrap">
      <div className="prefs login-prefs">
        <EffectsToggle />
        <ThemeToggle />
      </div>
      <div className="brand" style={{ fontSize: 24 }}>
        <SantaLogo size={56} />
        <span>{config.eventName()}</span>
      </div>
      <div className="login-card">
        <LoginForm linkError={error === "link"} />
      </div>
    </div>
  );
}
