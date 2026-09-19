"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";
import { Reveal, SplitLines } from "@/components/ui/motion";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  if (faqs.length === 0) return null;

  return (
    <section className="section" id="faq">
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Questions fréquentes
            </Reveal>
            <SplitLines className="display display--sm" lines={[<span key="l1">Tout</span>, <span key="l2">savoir</span>]} />
          </div>
          <Reveal className="head__right" delay={1}>
            <p className="lede">
              Une question qui n’est pas ici ? Écrivez-nous sur WhatsApp, on répond en général
              dans l’heure pendant les horaires d’ouverture.
            </p>
          </Reveal>
        </div>

        <Reveal className="faq">
          {faqs.map((faq) => {
            const isOpen = open === faq.id;
            return (
              <div className="faq__item" key={faq.id} data-open={isOpen}>
                <button
                  className="faq__q"
                  onClick={() => setOpen(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${faq.id}`}
                >
                  {faq.question}
                  <span className="faq__sign" aria-hidden />
                </button>
                <div
                  className="faq__a"
                  id={`faq-${faq.id}`}
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows .55s cubic-bezier(.16,1,.3,1)",
                  }}
                >
                  <div style={{ minHeight: 0 }}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
