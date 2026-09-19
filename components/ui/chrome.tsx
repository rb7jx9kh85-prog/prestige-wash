"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { Monogram } from "./logo";

/* ------------------------------------------------------------------ *
 * Défilement fluide (Lenis) + barre de progression.
 * ------------------------------------------------------------------ */

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Les ancres internes passent aussi par Lenis.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement)?.closest?.('a[href*="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const hash = href.startsWith("#") ? href : href.includes("/#") ? `#${href.split("#")[1]}` : "";
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      const samePage = href.startsWith("#") || window.location.pathname === href.split("#")[0];
      if (!samePage) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      node.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
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

  return <div ref={ref} className="progress" style={{ transform: "scaleX(0)" }} />;
}

/* ------------------------------------------------------------------ *
 * Curseur personnalisé : un point rapide, un anneau qui suit en retard.
 * ------------------------------------------------------------------ */

export function Cursor() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor";
    ring.className = "cursor-ring";
    document.body.append(dot, ring);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let frame = 0;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      const interactive = (event.target as HTMLElement)?.closest?.(
        'a, button, input, select, textarea, [role="button"], .ba, .faq__q',
      );
      ring.dataset.hover = interactive ? "true" : "false";
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
      dot.remove();
      ring.remove();
    };
  }, []);

  return null;
}

/* ------------------------------------------------------------------ *
 * Préchargeur : le monogramme se dessine, le compteur monte, le rideau
 * remonte pour découvrir la page.
 * ------------------------------------------------------------------ */

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const DURATION = 1600;
    let frame = 0;

    const tick = (now: number) => {
      if (reduced) {
        // Pas d'animation : le rideau disparaît au premier rendu utile.
        setPhase("done");
        return;
      }
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase("leaving");
        window.setTimeout(() => setPhase("done"), 900);
      }
    };
    frame = requestAnimationFrame(tick);

    document.documentElement.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") document.documentElement.style.overflow = "";
  }, [phase]);

  if (phase === "done") return null;

  return (
    <>
      <div
        className="preloader"
        style={{
          opacity: phase === "leaving" ? 0 : 1,
          transition: "opacity .5s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div className="preloader__inner">
          <Monogram className="preloader__mono" />
          <div className="preloader__bar">
            <i style={{ transform: `scaleX(${progress / 100})`, transition: "transform .15s linear" }} />
          </div>
          <div className="preloader__num">{String(progress).padStart(3, "0")} %</div>
        </div>
      </div>
      <div
        className="preloader__curtain"
        style={{
          transform: phase === "leaving" ? "scaleY(0)" : "scaleY(1)",
          transition: "transform .85s cubic-bezier(.76,0,.24,1) .15s",
        }}
      />
    </>
  );
}
