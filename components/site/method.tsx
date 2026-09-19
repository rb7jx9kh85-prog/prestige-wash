"use client";

import { useEffect, useRef } from "react";
import { METHOD_STEPS } from "@/lib/brand";
import { Reveal, SplitLines } from "@/components/ui/motion";

export function Method() {
  const railRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const list = listRef.current;
    if (!rail || !list) return;

    const steps = Array.from(list.querySelectorAll<HTMLElement>(".step"));
    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = list.getBoundingClientRect();
      const mid = window.innerHeight * 0.55;
      const progress = (mid - rect.top) / rect.height;
      rail.style.transform = `scaleY(${Math.min(1, Math.max(0, progress))})`;
      steps.forEach((step) => {
        const sr = step.getBoundingClientRect();
        step.classList.toggle("is-in", sr.top < mid);
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="section" id="methode" style={{ background: "var(--ink)" }}>
      <div className="shell method">
        <div className="method__sticky">
          <Reveal as="p" className="eyebrow">
            Notre protocole
          </Reveal>
          <SplitLines className="display display--sm" lines={[<span key="l1">Six étapes,</span>, <span key="l2">aucune</span>, <em key="e">approximation.</em>]} />
          <Reveal delay={1}>
            <p className="lede" style={{ marginTop: 22 }}>
              Le même protocole est appliqué à chaque intervention, qu’il s’agisse d’une
              citadine ou d’un canapé d’angle. C’est ce qui rend le résultat reproductible —
              et ce qui nous permet d’annoncer une durée fiable au moment de la réservation.
            </p>
          </Reveal>
        </div>

        <div className="method__steps" ref={listRef}>
          <div className="method__rail">
            <i ref={railRef as React.RefObject<HTMLElement>} style={{ height: "100%", transform: "scaleY(0)" }} />
          </div>
          {METHOD_STEPS.map((step, index) => (
            <article className="step" key={step.title}>
              <span className="step__no">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
                <span className="step__meta">{step.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
