import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/config";
import { initials } from "@/lib/format";
import { logout } from "@/lib/actions";
import { SantaLogo } from "@/components/SantaLogo";
import { Nav } from "@/components/Nav";
import { EffectsToggle, ThemeToggle } from "@/components/PrefToggles";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <SantaLogo />
            <span>Secret Santa</span>
          </Link>
          <Nav isAdmin={isAdminEmail(user.email)} />
          <div className="who">
            <div className="prefs">
              <EffectsToggle />
              <ThemeToggle />
            </div>
            <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
            <span className="who-name">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="link-btn" style={{ color: "var(--pine)" }}>Wyloguj</button>
            </form>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
    </>
  );
}
