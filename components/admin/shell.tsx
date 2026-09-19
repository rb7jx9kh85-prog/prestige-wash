"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monogram } from "@/components/ui/logo";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: "M3 12h5l2 6 4-14 2 8h5" },
  { href: "/admin/reservations", label: "Réservations", icon: "M3 5h18M3 12h18M3 19h12" },
  { href: "/admin/calendrier", label: "Calendrier", icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { href: "/admin/clients", label: "Clients", icon: "M4 20a6 6 0 0112 0M10 11a4 4 0 100-8 4 4 0 000 8M17 20a5 5 0 00-3-4.6" },
  { href: "/admin/paiements", label: "Acomptes", icon: "M3 7h18v10H3zM3 11h18M7 15h3" },
  { href: "/admin/prestations", label: "Prestations", icon: "M5 4h14v6H5zM5 14h14v6H5z" },
  { href: "/admin/disponibilites", label: "Disponibilités", icon: "M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // La page de connexion s'affiche sans la coque.
  if (pathname === "/admin/connexion") return <>{children}</>;

  return (
    <div className="adm">
      <aside className="adm__side">
        <Link className="adm__brand" href="/">
          <Monogram />
          <span>
            <b>PRESTIGE WASH</b>
            <span>Back-office</span>
          </span>
        </Link>

        <nav className="adm__nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={
                link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d={link.icon} />
              </svg>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="adm__foot">
          <Link href="/">← Voir le site public</Link>
        </div>
      </aside>

      <main className="adm__main">{children}</main>
    </div>
  );
}
