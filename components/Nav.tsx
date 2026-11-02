"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Mój Secret Santa" },
    { href: "/dzieci", label: "Listy dzieci" },
    ...(isAdmin ? [{ href: "/admin", label: "Organizator" }] : []),
  ];
  return (
    <nav className="nav" aria-label="Główna">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
