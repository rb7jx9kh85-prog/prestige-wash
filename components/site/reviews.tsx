import type { Testimonial } from "@/lib/types";
import { Reveal, SplitLines } from "@/components/ui/motion";

function Stars({ count }: { count: number }) {
  return (
    <div className="review__stars" aria-label={`${count} étoiles sur 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 0l2.2 5.2 5.8.5-4.4 3.8 1.3 5.5L8 12.1 3.1 15l1.3-5.5L0 5.7l5.8-.5z" />
        </svg>
      ))}
    </div>
  );
}

export function Reviews({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const allDemo = testimonials.every((item) => item.is_demo);

  return (
    <section className="section" id="avis" style={{ background: "var(--ink)" }}>
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Avis clients
            </Reveal>
            <SplitLines className="display display--sm" lines={[<span key="l1">Ce qu’on</span>, <span key="l2">en dit</span>]} />
          </div>
          <Reveal className="head__right" delay={1}>
            {allDemo && (
              <span className="demo-flag">
                ⚠ Témoignages de démonstration — à remplacer par de vrais avis avant la mise en ligne.
              </span>
            )}
            <p className="lede">
              Les avis se gèrent depuis l’espace d’administration : chaque entrée porte un
              indicateur « démonstration » tant qu’elle n’a pas été remplacée.
            </p>
          </Reveal>
        </div>

        <div className="reviews">
          {testimonials.map((item, index) => (
            <Reveal key={item.id} delay={(index % 3) as 0 | 1 | 2}>
              <article className="review">
                <Stars count={item.rating} />
                <p>« {item.content} »</p>
                <footer>
                  <b>{item.author}</b>
                  <span>
                    {item.city}
                    {item.service ? ` · ${item.service}` : ""}
                  </span>
                </footer>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
