"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ *
 * Apparition au scroll — un seul IntersectionObserver partagé, plutôt
 * qu'un observateur par élément.
 * ------------------------------------------------------------------ */

let sharedObserver: IntersectionObserver | null = null;

function observe(node: Element) {
  if (typeof IntersectionObserver === "undefined") {
    node.classList.add("is-in");
    return () => {};
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            sharedObserver?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
  }
  sharedObserver.observe(node);
  return () => sharedObserver?.unobserve(node);
}

export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  ...rest
}: {
  as?: ElementType;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return observe(ref.current);
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} data-delay={delay} {...rest}>
      {children}
    </Tag>
  );
}

/** Titre révélé ligne par ligne, chaque ligne glissant depuis le bas. */
export function SplitLines({
  lines,
  className = "",
  as: Tag = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return observe(ref.current);
  }, []);
  return (
    <Tag ref={ref} className={className}>
      {Children.toArray(lines).map((line, i) => (
        <span className="clip-line" key={i}>
          <span style={{ transitionDelay: `${i * 90}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * Compteur animé
 * ------------------------------------------------------------------ */

export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1500,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        // Sans animation, la valeur finale s'affiche directement.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setValue(to);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(to * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      <i>{suffix}</i>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Bouton magnétique : suit légèrement le curseur.
 * ------------------------------------------------------------------ */

export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      node.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const reset = () => {
      node.style.transform = "translate(0px, 0px)";
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
    };
  }, [strength]);

  return (
    <span ref={ref} style={{ display: "inline-flex", transition: "transform .45s cubic-bezier(.16,1,.3,1)" }}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Parallaxe verticale légère, pilotée par le scroll.
 * ------------------------------------------------------------------ */

export function useParallax(amount = 90) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      node.style.transform = `translate3d(0, ${(-progress * amount).toFixed(2)}px, 0)`;
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
  }, [amount]);

  return ref;
}
