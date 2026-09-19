"use client";

import { useEffect, useRef } from "react";
import { TICKER_ITEMS } from "@/lib/brand";

/**
 * Bandeau défilant : la vitesse suit le sens et l'intensité du scroll,
 * ce qui donne au ruban une inertie perceptible.
 */
export function Ticker() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let offset = 0;
    let velocity = 0;
    let lastScroll = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      velocity += (window.scrollY - lastScroll) * 0.35;
      lastScroll = window.scrollY;
    };

    const loop = () => {
      const half = track.scrollWidth / 2 || 1;
      offset -= 0.55 + velocity * 0.1;
      velocity *= 0.9;
      if (offset <= -half) offset += half;
      if (offset > 0) offset -= half;
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      frame = requestAnimationFrame(loop);
    };

    if (!reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      frame = requestAnimationFrame(loop);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const run = (key: string) => (
    <span className="ticker__item" key={key} aria-hidden={key === "b"}>
      {TICKER_ITEMS.map((item) => (
        <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 26 }}>
          {item}
          <i>✦</i>
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker">
      <div className="ticker__track" ref={trackRef}>
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}
