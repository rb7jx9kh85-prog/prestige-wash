"use client";

import { BRAND } from "@/lib/brand";

/**
 * Carte stylisée de la vallée du Rhône, dessinée en SVG plutôt qu'incrustée
 * depuis un service tiers : pas de dépendance externe, pas de cookie, et une
 * animation qui reste dans la charte.
 *
 * Les positions viennent des coordonnées réelles des localités, projetées
 * linéairement sur la zone de dessin.
 */

const BOUNDS = { west: 6.9, east: 8.05, north: 46.37, south: 46.05 };
const W = 1000;
const H = 400;

const project = (lat: number, lng: number) => ({
  x: ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * W,
  y: ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * H,
});

const TOWNS: { name: string; lat: number; lng: number; anchor?: "start" | "middle" | "end"; dy?: number }[] = [
  { name: "Monthey", lat: 46.254, lng: 6.949, anchor: "start" },
  { name: "Saint-Maurice", lat: 46.218, lng: 7.003, anchor: "start", dy: 18 },
  { name: "Martigny", lat: 46.103, lng: 7.073, anchor: "start" },
  { name: "Verbier", lat: 46.096, lng: 7.228, anchor: "middle", dy: 20 },
  { name: "Saxon", lat: 46.15, lng: 7.18, anchor: "middle", dy: -12 },
  { name: "Nendaz", lat: 46.183, lng: 7.308, anchor: "middle", dy: 20 },
  { name: "Conthey", lat: 46.226, lng: 7.305, anchor: "end", dy: -12 },
  { name: "Sion", lat: 46.233, lng: 7.36, anchor: "middle", dy: -14 },
  { name: "Crans-Montana", lat: 46.313, lng: 7.479, anchor: "middle", dy: -12 },
  { name: "Sierre", lat: 46.292, lng: 7.533, anchor: "middle", dy: 20 },
  { name: "Leuk", lat: 46.317, lng: 7.634, anchor: "middle", dy: -12 },
  { name: "Visp", lat: 46.294, lng: 7.881, anchor: "middle", dy: 20 },
  { name: "Brig", lat: 46.316, lng: 7.988, anchor: "end", dy: -12 },
];

// La vallée, tracée d'ouest en est en suivant le cours du Rhône.
const VALLEY = [
  [46.26, 6.93], [46.23, 7.0], [46.14, 7.06], [46.12, 7.12],
  [46.15, 7.2], [46.19, 7.28], [46.23, 7.36], [46.26, 7.45],
  [46.29, 7.54], [46.31, 7.65], [46.3, 7.8], [46.31, 8.0],
] as const;

const valleyPath = VALLEY.map(([lat, lng], i) => {
  const { x, y } = project(lat, lng);
  return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

const base = project(BRAND.map.lat, BRAND.map.lng);

export function ValaisMap() {
  return (
    <div className="vmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Zone d’intervention de Prestige Wash en Valais">
        <defs>
          <linearGradient id="vmap-river" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f9efb" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#62c8ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#0f9efb" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="vmap-halo">
            <stop offset="0%" stopColor="#0f9efb" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0f9efb" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Relief suggéré de part et d'autre de la vallée */}
        <path className="vmap__ridge" d={`${valleyPath}`} transform="translate(0,-86)" />
        <path className="vmap__ridge" d={`${valleyPath}`} transform="translate(0,-52)" />
        <path className="vmap__ridge" d={`${valleyPath}`} transform="translate(0,54)" />
        <path className="vmap__ridge" d={`${valleyPath}`} transform="translate(0,92)" />

        <path className="vmap__river" d={valleyPath} stroke="url(#vmap-river)" />

        <circle cx={base.x} cy={base.y} r="120" fill="url(#vmap-halo)" />

        {TOWNS.map((town, index) => {
          const { x, y } = project(town.lat, town.lng);
          return (
            <g className="vmap__town" key={town.name} style={{ animationDelay: `${index * 90}ms` }}>
              <circle cx={x} cy={y} r="4.5" />
              <text x={x} y={y + (town.dy ?? -12)} textAnchor={town.anchor ?? "middle"}>
                {town.name}
              </text>
            </g>
          );
        })}

        <g className="vmap__base">
          <circle cx={base.x} cy={base.y} r="9" />
          <circle className="vmap__ping" cx={base.x} cy={base.y} r="9" />
          <circle className="vmap__ping vmap__ping--late" cx={base.x} cy={base.y} r="9" />
        </g>
      </svg>

      <span className="vmap__legend">
        <i />
        Base d’intervention · {BRAND.region}
      </span>
    </div>
  );
}
