import { BRAND, VALAIS_CITIES } from "@/lib/brand";
import { Reveal, SplitLines } from "@/components/ui/motion";
import { ValaisMap } from "@/components/site/valais-map";

export function Zone() {
  return (
    <section className="section" id="zone">
      <div className="shell zone">
        <div>
          <Reveal as="p" className="eyebrow">
            Notre adresse 📍
          </Reveal>
          <SplitLines className="display display--sm" lines={[<span key="l1">Tout le</span>, <em key="v">Valais.</em>]} />
          <Reveal delay={1}>
            <p className="lede" style={{ marginTop: 22 }}>
              Nous venons à vous : domicile, place de parc, bureau. Une prise 230 V suffit,
              nous apportons l’eau, les machines et les produits. Le déplacement est compris
              dans le tarif pour le Valais central.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <ul className="zone__cities">
              {VALAIS_CITIES.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={3}>
            <a
              className="btn btn--ghost"
              href={BRAND.whatsapp}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 30 }}
            >
              Votre commune n’est pas listée ? Écrivez-nous
            </a>
          </Reveal>
        </div>

        <Reveal delay={1}>
          <ValaisMap />
        </Reveal>
      </div>
    </section>
  );
}
