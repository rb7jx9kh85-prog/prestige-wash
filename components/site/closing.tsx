"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BRAND, NAV_LINKS } from "@/lib/brand";
import { Logo } from "@/components/ui/logo";
import { Magnetic, Reveal, SplitLines } from "@/components/ui/motion";

export function CallToAction() {
  return (
    <section className="cta-band">
      <div className="shell">
        <Reveal as="p" className="eyebrow" style={{ justifyContent: "center" }}>
          Prêt quand vous l’êtes
        </Reveal>
        <SplitLines
          className="display"
          lines={[<span key="l1">Réservez votre</span>, <em key="c">créneau.</em>]}
        />
        <Reveal delay={1}>
          <p className="lede" style={{ margin: "26px auto 0" }}>
            Choisissez la prestation, la date et l’heure. L’acompte de {BRAND.depositAmount} CHF
            bloque le créneau et se déduit du montant final.
          </p>
        </Reveal>
        <Reveal delay={2}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
            <Magnetic>
              <Link className="btn btn--primary" href="/reservation">
                Prendre rendez-vous
              </Link>
            </Magnetic>
            <a className="btn btn--ghost" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
              Demander un devis
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Ligne de titre géante qui glisse doucement pendant le scroll. */
function KineticLine() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const p = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      node.style.transform = `translate3d(${(-p * 18 + 6).toFixed(1)}%, 0, 0)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="footer__kinetic" ref={ref} aria-hidden>
      PRESTIGE WASH · PRESTIGE WASH · PRESTIGE WASH
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <KineticLine />
      <div className="shell">
        <div className="footer__cols">
          <div>
            <Logo />
            <p style={{ marginTop: 18, color: "var(--muted)", fontSize: 13.5, maxWidth: "34ch" }}>
              {BRAND.tagline} {BRAND.subtitle}.
            </p>
          </div>

          <div>
            <h5>Le site</h5>
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Réserver</h5>
            <ul>
              <li><Link href="/reservation">Prendre rendez-vous</Link></li>
              <li><Link href="/reservation?service=nettoyage-automobile">Nettoyage automobile</Link></li>
              <li><Link href="/reservation?service=nettoyage-textile">Nettoyage textile</Link></li>
              <li><Link href="/reservation?service=location-machines">Location de machines</Link></li>
            </ul>
          </div>

          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href={`tel:${BRAND.phone}`}>{BRAND.phoneDisplay}</a></li>
              <li><a href={BRAND.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></li>
              <li>{BRAND.region}</li>
              <li><Link href="/admin">Espace administration</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} {BRAND.name}. Tous droits réservés.</span>
          <span>Paiement d’acompte en mode démonstration — aucune transaction réelle.</span>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a className="wa-float" href={BRAND.whatsapp} target="_blank" rel="noreferrer" aria-label="Écrire sur WhatsApp">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.19-1.36a9.9 9.9 0 004.85 1.24h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.01s.75-2.14 1.02-2.43c.27-.29.58-.37.78-.37h.56c.18 0 .42-.07.66.5.24.58.83 2.01.9 2.16.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.59.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.3 2.35 1.45.29.14.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.14.26.1 1.67.79 1.96.93.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
      </svg>
    </a>
  );
}
