import Link from "next/link";
import { BRAND, TARIFFS } from "@/lib/brand";
import { Reveal, SplitLines } from "@/components/ui/motion";

export function Tariffs() {
  return (
    <section className="section" id="tarifs" style={{ background: "var(--ink)" }}>
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Tarifs
            </Reveal>
            <SplitLines className="display display--sm" lines={[<span key="l1">Dès</span>, <em key="p">80.-</em>]} />
          </div>
          <Reveal className="head__right" delay={1}>
            <p className="lede">
              Les montants ci-dessous sont des points de départ : le prix exact est calculé
              au moment de la réservation, selon la formule et les options retenues. Le
              déplacement est compris en Valais central.
            </p>
          </Reveal>
        </div>

        <div className="tariffs">
          {TARIFFS.map((tariff, index) => (
            <Reveal key={tariff.slug} delay={(index % 3) as 0 | 1 | 2}>
              <article className="tariff" data-featured={tariff.featured}>
                {tariff.badge && <span className="tariff__badge">{tariff.badge}</span>}
                <div style={{ fontSize: 26, marginBottom: 12 }} aria-hidden>
                  {tariff.emoji}
                </div>
                <h3>{tariff.title}</h3>
                <p>{tariff.intro}</p>
                <ul className="tariff__grid">
                  {tariff.lines.map((line) => (
                    <li key={line.label}>
                      <span>{line.label}</span>
                      <b>{line.price}</b>
                    </li>
                  ))}
                </ul>
                <Link
                  className={`btn ${tariff.featured ? "btn--primary" : "btn--ghost"}`}
                  href={`/reservation?service=${tariff.slug}`}
                  style={{ width: "100%", marginTop: 26 }}
                >
                  Réserver
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="deposit-note" delay={2}>
          <b>Acompte de {BRAND.depositAmount}.- </b>
          <span>
            Il bloque votre créneau, garantit que le rendez-vous sera honoré, et il est
            intégralement déduit du montant final. Le solde se règle sur place, en espèces
            ou par TWINT.
          </span>
        </Reveal>
      </div>
    </section>
  );
}
