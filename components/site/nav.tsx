"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRAND, NAV_LINKS } from "@/lib/brand";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/motion";

export function SiteNav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="nav" data-stuck={stuck}>
        <div className="shell nav__inner">
          <Link href="/" aria-label={BRAND.name}>
            <Logo />
          </Link>

          <nav className="nav__links" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav__actions">
            <a className="btn btn--ghost btn--sm" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
              {BRAND.phoneDisplay}
            </a>
            <Magnetic strength={0.2}>
              <Link className="btn btn--primary btn--sm" href="/reservation">
                Réserver
              </Link>
            </Magnetic>
            <button
              className="burger"
              data-open={open}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
            >
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="drawer">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <small>{link.note}</small>
              {link.label}
            </Link>
          ))}
          <Link href="/reservation" onClick={() => setOpen(false)}>
            <small>Acompte {BRAND.depositAmount}.- déduit du total</small>
            Réserver
          </Link>
        </div>
      )}
    </>
  );
}
