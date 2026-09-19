"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { STATS } from "@/lib/brand";
import { Counter, Reveal, SplitLines } from "@/components/ui/motion";

/**
 * Comparateur avant / après. L'image « avant » est la photo désaturée et
 * assombrie ; la révélation suit le pointeur, le clavier ou, au premier
 * affichage, une animation d'amorce.
 */
function BeforeAfter() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(52);
  const dragging = useRef(false);
  const touched = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(96, Math.max(4, ratio)));
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      touched.current = true;
      setFromClientX(event.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromClientX]);

  // Amorce : le volet balaie une fois pour montrer qu'il est manipulable.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          if (touched.current) return;
          const p = Math.min((now - start) / 2200, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setPosition(52 + Math.sin(eased * Math.PI) * 30);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className="ba"
      ref={wrapRef}
      role="slider"
      tabIndex={0}
      aria-label="Comparer l’avant et l’après"
      aria-valuemin={4}
      aria-valuemax={96}
      aria-valuenow={Math.round(position)}
      onPointerDown={(event) => {
        dragging.current = true;
        touched.current = true;
        setFromClientX(event.clientX);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") setPosition((v) => Math.max(4, v - 4));
        if (event.key === "ArrowRight") setPosition((v) => Math.min(96, v + 4));
      }}
    >
      <Image
        src="/media/audi-q3-interieur.jpg"
        alt="Intérieur de véhicule après nettoyage Prestige Wash"
        fill
        sizes="(max-width: 1000px) 100vw, 1200px"
        style={{ objectFit: "cover" }}
      />
      <div className="ba__clip" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src="/media/audi-q3-interieur.jpg"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1000px) 100vw, 1200px"
          className="ba__after"
          style={{ objectFit: "cover" }}
        />
      </div>

      <span className="ba__tag ba__tag--before">Avant · simulation</span>
      <span className="ba__tag ba__tag--after">Après · photo réelle</span>

      <div className="ba__handle" style={{ left: `${position}%` }}>
        <span className="ba__knob">
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden>
            <path d="M6 1L1 6l5 5M14 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        </span>
      </div>
    </div>
  );
}

export function Results() {
  return (
    <section className="section" id="resultats">
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Nos résultats 🧼
            </Reveal>
            <SplitLines
              className="display display--sm"
              lines={[<span key="l1">La preuve</span>, <span key="l2">par l’image</span>]}
            />
          </div>
          <Reveal className="head__right" delay={1}>
            <p className="lede">
              Faites glisser le volet. À droite, une photo réelle d’intervention ; à
              gauche, cette même photo ternie pour figurer l’état de départ. Dès que les
              clichés « avant » d’origine seront fournis, ils remplaceront la simulation.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <BeforeAfter />
        </Reveal>

        <Reveal className="stats" delay={1} style={{ marginTop: 26 }}>
          {STATS.map((stat) => (
            <div className="stat" key={stat.label}>
              <b>
                <Counter to={stat.value} prefix={"prefix" in stat ? stat.prefix : ""} suffix={stat.suffix} />
              </b>
              <span>{stat.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
