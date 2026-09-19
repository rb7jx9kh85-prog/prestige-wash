import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { TARIFFS } from "@/lib/brand";
import type { Faq, GalleryItem, Service, ServiceOption, Testimonial, VehicleCategory } from "@/lib/types";

/**
 * Le catalogue vit dans Supabase. Ces valeurs de repli permettent au site
 * vitrine de s'afficher tel quel tant que la base n'est pas branchée ; la
 * réservation, elle, exige une vraie connexion.
 */
const FALLBACK_SERVICES: Service[] = [
  {
    id: "fallback-auto",
    slug: "nettoyage-automobile",
    category: "auto",
    emoji: "🚗",
    name: "Nettoyage automobile",
    tagline: "Intérieur complet, comme sorti de concession",
    description:
      "Intérieur complet, sièges tissu ou cuir, vapeur, aspiration et finitions professionnelles.",
    details: [
      "Aspiration intégrale habitacle et coffre",
      "Injection-extraction des sièges et moquettes",
      "Nettoyage vapeur des plastiques et aérations",
      "Traitement et nourrissage du cuir",
    ],
    price_from: 80,
    price_to: 300,
    duration_min: 150,
    image_path: "/media/audi-q3-interieur.jpg",
    is_active: true,
    is_bookable: true,
    sort_order: 1,
  },
  {
    id: "fallback-textile",
    slug: "nettoyage-textile",
    category: "textile",
    emoji: "🛋️",
    name: "Nettoyage textile",
    tagline: "Canapés, matelas, tapis : une seconde vie",
    description:
      "Canapés, matelas, tapis, fauteuils et sièges. Élimination des tâches et des mauvaises odeurs.",
    details: [
      "Injection-extraction professionnelle",
      "Détachage ciblé avant traitement",
      "Élimination des acariens et des odeurs",
      "Séchage accéléré sur place",
    ],
    price_from: 80,
    price_to: 250,
    duration_min: 120,
    image_path: "/media/detail-siege.jpg",
    is_active: true,
    is_bookable: true,
    sort_order: 2,
  },
  {
    id: "fallback-location",
    slug: "location-machines",
    category: "location",
    emoji: "🧼",
    name: "Location de machines",
    tagline: "Le matériel pro, chez vous",
    description: "Louez du matériel professionnel pour nettoyer vous-même vos textiles.",
    details: [
      "Injecteur-extracteur professionnel",
      "Produits détachants fournis",
      "Prise en main expliquée à la remise",
      "Livraison et reprise possibles",
    ],
    price_from: 60,
    price_to: 180,
    duration_min: 30,
    image_path: "/media/porsche-vapeur.jpg",
    is_active: true,
    is_bookable: true,
    sort_order: 3,
  },
];

const FALLBACK_GALLERY: GalleryItem[] = [
  { id: "g1", title: "Audi Q3 — intérieur complet", subtitle: "Sièges tissu, moquettes et plastiques", category: "auto", image_path: "/media/audi-q3-interieur.jpg" },
  { id: "g2", title: "Porsche Panamera — vapeur", subtitle: "Console et cuir traités à la vapeur", category: "auto", image_path: "/media/porsche-vapeur.jpg" },
  { id: "g3", title: "Audi S line — habitacle", subtitle: "Finition concession, prêt à livrer", category: "auto", image_path: "/media/audi-s-line.jpg" },
  { id: "g4", title: "Détail siège", subtitle: "Injection-extraction en profondeur", category: "textile", image_path: "/media/detail-siege.jpg" },
];

const FALLBACK_FAQS: Faq[] = [
  { id: "f1", question: "Où intervenez-vous ?", answer: "Dans tout le Valais, directement chez vous : domicile, parking, place de travail.", sort_order: 1 },
  { id: "f2", question: "Pourquoi un acompte de 50 CHF ?", answer: "Il bloque le créneau, garantit que le rendez-vous sera honoré, et il est intégralement déduit du montant final.", sort_order: 2 },
  { id: "f3", question: "Ai-je besoin d’eau ou d’électricité ?", answer: "Une simple prise 230 V suffit. Nous apportons notre eau, nos machines et nos produits.", sort_order: 3 },
];

export type SiteContent = {
  services: Service[];
  gallery: GalleryItem[];
  faqs: Faq[];
  testimonials: Testimonial[];
  connected: boolean;
};

export async function getSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured) {
    return {
      services: FALLBACK_SERVICES,
      gallery: FALLBACK_GALLERY,
      faqs: FALLBACK_FAQS,
      testimonials: [],
      connected: false,
    };
  }

  const supabase = createPublicClient();
  const [services, gallery, faqs, testimonials] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("gallery_items").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("faqs").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("testimonials").select("*").eq("is_active", true).order("sort_order"),
  ]);

  return {
    services: (services.data as Service[] | null)?.length ? (services.data as Service[]) : FALLBACK_SERVICES,
    gallery: (gallery.data as GalleryItem[] | null) ?? FALLBACK_GALLERY,
    faqs: (faqs.data as Faq[] | null) ?? FALLBACK_FAQS,
    testimonials: (testimonials.data as Testimonial[] | null) ?? [],
    connected: !services.error,
  };
}

export type BookingCatalog = {
  services: Service[];
  options: ServiceOption[];
  variants: VehicleCategory[];
  connected: boolean;
};

export async function getBookingCatalog(): Promise<BookingCatalog> {
  if (!isSupabaseConfigured) {
    return { services: [], options: [], variants: [], connected: false };
  }

  const supabase = createPublicClient();
  const [services, options, variants] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).eq("is_bookable", true).order("sort_order"),
    supabase.from("service_options").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("vehicle_categories").select("*").eq("is_active", true).order("sort_order"),
  ]);

  return {
    services: (services.data as Service[] | null) ?? [],
    options: (options.data as ServiceOption[] | null) ?? [],
    variants: (variants.data as VehicleCategory[] | null) ?? [],
    connected: !services.error && Boolean(services.data?.length),
  };
}

/** Repère tarifaire affiché dans le tunnel de réservation. */
export function tariffFor(slug: string) {
  return TARIFFS.find((tariff) => tariff.slug === slug);
}
