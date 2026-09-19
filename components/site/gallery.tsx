"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { GalleryItem } from "@/lib/types";
import { Reveal, SplitLines } from "@/components/ui/motion";

/**
 * Bande d'images qui se déplace horizontalement pendant que la section
 * traverse l'écran, avec une parallaxe verticale interne à chaque photo.
 */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const images = Array.from(track.querySelectorAll<HTMLElement>(".shot img"));
    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const span = rect.height + window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span));
      const travel = Math.max(0, track.scrollWidth - window.innerWidth + 48);
      track.style.transform = `translate3d(${(-progress * travel).toFixed(1)}px, 0, 0)`;

      images.forEach((img) => {
        const ir = img.getBoundingClientRect();
        const p = (ir.left + ir.width / 2 - window.innerWidth / 2) / window.innerWidth;
        img.style.transform = `translate3d(0, ${(p * -22).toFixed(1)}px, 0)`;
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
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section className="section" id="galerie" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="shell">
        <div className="head">
          <div className="head__left">
            <Reveal as="p" className="eyebrow">
              Galerie
            </Reveal>
            <SplitLines className="display display--sm" lines={[<span key="l1">Nos</span>, <span key="l2">interventions</span>]} />
          </div>
          <Reveal className="head__right" delay={1}>
            <p className="lede">
              Des photos prises sur nos chantiers en Valais, sans retouche ni mise en scène.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="gallery-strip">
        <div className="gallery-track" ref={trackRef}>
          {items.map((item) => (
            <figure className="shot" key={item.id}>
              <Image
                src={item.image_path}
                alt={item.title}
                width={900}
                height={1125}
                sizes="(max-width: 900px) 70vw, 480px"
                style={{ objectFit: "cover" }}
              />
              <figcaption className="shot__cap">
                <b>{item.title}</b>
                <span>{item.subtitle}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
