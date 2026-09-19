"use client";

import Link from "next/link";
import type { PointerEvent } from "react";
import type { Service } from "@/lib/types";
import { Reveal, SplitLines } from "@/components/ui/motion";

/** Halo bleu qui suit le curseur sur la carte. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
  card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
  const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
  card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
}

function resetPointer(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.transform = "";
}

export function Services({ services }: { services: Service[] }) {
  return (
    <section className="section" id="prestations">
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Ce que nous proposons ✅
            </Reveal>
            <SplitLines className="display display--sm" lines={[<span key="l1">Trois</span>, <span key="l2">prestations</span>]} />
          </div>
          <Reveal className="head__right" delay={1}>
            <p className="lede">
              Le véhicule, le textile de la maison, ou le matériel professionnel si vous
              préférez faire vous-même. Chaque prestation se réserve en ligne avec un
              créneau précis et un acompte de 50 CHF déduit du montant final.
            </p>
          </Reveal>
        </div>

        <div className="services">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={(index % 3) as 0 | 1 | 2}>
              <article
                className="svc"
                style={{ ["--img" as string]: `url(${service.image_path ?? "/media/detail-siege.jpg"})` }}
                onPointerMove={trackPointer}
                onPointerLeave={resetPointer}
              >
                <p className="svc__no">0{index + 1} — {service.tagline}</p>

                <div className="svc__body">
                  <div className="svc__emoji" aria-hidden>{service.emoji}</div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <ul className="svc__list">
                    {service.details.slice(0, 4).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <div className="svc__foot">
                  <span className="price">
                    <small>À partir de</small>
                    <b>{service.price_from}</b>
                    <span>.-</span>
                  </span>
                  <Link className="btn btn--ghost btn--sm" href={`/reservation?service=${service.slug}`}>
                    Réserver
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
