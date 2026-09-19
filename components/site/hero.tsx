"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND, PROMISES } from "@/lib/brand";
import { Magnetic, SplitLines, useParallax } from "@/components/ui/motion";

export function Hero() {
  const bgRef = useParallax(130);

  return (
    <section className="hero">
      <div className="hero__bg" ref={bgRef as React.RefObject<HTMLDivElement>}>
        <Image
          src="/media/audi-s-line.jpg"
          alt="Habitacle d’une Audi S line nettoyé par Prestige Wash"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="hero__veil" />
      <div className="hero__grid" />

      <div className="shell hero__content">
        <p className="eyebrow">{BRAND.region}</p>

        <SplitLines
          as="h1"
          className="hero__title"
          lines={[
            <span key="l1">L’excellence</span>,
            <span key="l2">dans chaque</span>,
            <em key="d">détail.</em>,
          ]}
        />

        <p className="hero__sub">{BRAND.subtitle}</p>

        <div className="hero__row">
          <div>
            <p className="hero__pitch">{BRAND.pitch}</p>
            <ul className="promises">
              {PROMISES.map((promise) => (
                <li className="promise" key={promise}>
                  <b>✓</b>
                  {promise}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero__cta">
            <Magnetic>
              <Link className="btn btn--primary" href="/reservation">
                Réserver une intervention
              </Link>
            </Magnetic>
            <a className="btn btn--ghost" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
              Demander un devis
            </a>
          </div>
        </div>

        <div className="scroll-hint">
          <i />
          Faire défiler
        </div>
      </div>
    </section>
  );
}
