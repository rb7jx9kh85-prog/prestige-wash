/**
 * Contenu éditorial de Prestige Wash.
 * Les textes marqués « verbatim » sont repris tels quels de prestigewash.ch ;
 * les tarifs de référence proviennent du flyer officiel (« DÈS 80.- »).
 */

export const BRAND = {
  name: "PRESTIGE WASH",
  short: "Prestige Wash",
  /* verbatim */
  tagline: "L’excellence dans chaque détail.",
  /* verbatim */
  subtitle: "Nettoyage automobile & textile à domicile en Valais",
  /* verbatim */
  pitch:
    "Nous redonnons une seconde vie à vos véhicules, canapés, matelas, tapis et sièges grâce à un nettoyage professionnel directement chez vous.",
  phone: "+41754282715",
  phoneDisplay: "+41 75 428 27 15",
  whatsapp: "https://wa.me/41754282715",
  region: "Valais, Suisse",
  map: { lat: 46.227818, lng: 7.397365, zoom: 14 },
  depositAmount: 50,
  currency: "CHF",
} as const;

/* verbatim — les quatre promesses de la page d'accueil */
export const PROMISES = [
  "Déplacement à domicile",
  "Résultat professionnel",
  "Produits et matériel haut de gamme",
  "Intervention rapide dans tout le Valais",
] as const;

export const NAV_LINKS = [
  { href: "/#resultats", label: "Résultats", note: "Avant / après" },
  { href: "/#prestations", label: "Prestations", note: "Ce que nous proposons" },
  { href: "/#methode", label: "Méthode", note: "Notre protocole" },
  { href: "/#tarifs", label: "Tarifs", note: "Dès 80.-" },
  { href: "/#zone", label: "Zone", note: "Tout le Valais" },
  { href: "/#faq", label: "FAQ", note: "Vos questions" },
] as const;

export const TICKER_ITEMS = [
  "Nettoyage automobile",
  "Injection-extraction",
  "Nettoyage vapeur",
  "Canapés & matelas",
  "Tapis & fauteuils",
  "Traitement cuir",
  "Anti-odeurs",
  "Location de machines",
  "À domicile en Valais",
] as const;

export const STATS = [
  { value: 80, prefix: "dès ", suffix: ".-", label: "Le tarif d’entrée" },
  { value: 100, suffix: " %", label: "À domicile, chez vous" },
  { value: 2, suffix: " h 30", label: "Pour un intérieur complet" },
  { value: 50, suffix: ".-", label: "D’acompte, déduit du total" },
] as const;

export const METHOD_STEPS = [
  {
    title: "Diagnostic sur place",
    text: "Nous inspectons chaque surface à la lampe : tissus, cuirs, plastiques, moquettes. Les taches sont identifiées une à une avant de choisir le produit adapté.",
    meta: "Étape 1 · 10 minutes",
  },
  {
    title: "Aspiration en profondeur",
    text: "Aspiration intégrale de l’habitacle ou du textile, brosses rotatives dans les coutures, les rails et les zones que l’on ne voit jamais.",
    meta: "Étape 2 · 20 minutes",
  },
  {
    title: "Détachage ciblé",
    text: "Chaque tache reçoit son traitement : gras, encre, vin, café, traces organiques. Temps de pause respecté, aucune agression de la fibre.",
    meta: "Étape 3 · 25 minutes",
  },
  {
    title: "Injection-extraction & vapeur",
    text: "L’eau chaude sous pression décolle la saleté incrustée, l’extraction la retire immédiatement. La vapeur assainit plastiques et aérations.",
    meta: "Étape 4 · 45 minutes",
  },
  {
    title: "Soin des matières nobles",
    text: "Le cuir est nettoyé en douceur puis nourri. Les plastiques reçoivent une protection UV mate, sans effet gras ni brillance artificielle.",
    meta: "Étape 5 · 20 minutes",
  },
  {
    title: "Séchage et contrôle final",
    text: "Souffleurs professionnels, contrôle à la lampe d’inspection, désodorisation longue durée. Nous ne partons qu’une fois le résultat validé avec vous.",
    meta: "Étape 6 · 20 minutes",
  },
] as const;

export const VALAIS_CITIES = [
  "Sion", "Sierre", "Martigny", "Monthey", "Conthey", "Vétroz", "Ardon",
  "Saint-Maurice", "Fully", "Saxon", "Riddes", "Savièse", "Nendaz",
  "Crans-Montana", "Verbier", "Visp", "Brig", "Leuk",
] as const;

/** Repères tarifaires affichés sur le site, alignés sur le flyer officiel. */
export const TARIFFS = [
  {
    slug: "nettoyage-automobile",
    emoji: "🚗",
    title: "Véhicules — intérieur",
    intro: "Intérieur complet, sièges tissu ou cuir, vapeur, aspiration et finitions professionnelles.",
    featured: true,
    badge: "Le plus demandé",
    lines: [
      { label: "Citadine", price: "dès 80.-" },
      { label: "Berline / break", price: "dès 105.-" },
      { label: "SUV / monospace", price: "dès 125.-" },
      { label: "Van / 7 places", price: "dès 160.-" },
      { label: "Traitement cuir", price: "+ 45.-" },
      { label: "Traitement anti-odeurs", price: "+ 40.-" },
    ],
  },
  {
    slug: "nettoyage-textile",
    emoji: "🛋️",
    title: "Textile — à domicile",
    intro: "Canapés, matelas, tapis, fauteuils et sièges. Élimination des tâches et des mauvaises odeurs.",
    featured: false,
    badge: "",
    lines: [
      { label: "Canapé 2 places", price: "dès 80.-" },
      { label: "Canapé 3 places", price: "dès 110.-" },
      { label: "Canapé d’angle", price: "dès 145.-" },
      { label: "Matelas", price: "dès 120.-" },
      { label: "Fauteuil", price: "dès 90.-" },
      { label: "Tapis (jusqu’à 3 m²)", price: "dès 100.-" },
    ],
  },
  {
    slug: "location-machines",
    emoji: "🧼",
    title: "Location de machines",
    intro: "Louez du matériel professionnel pour nettoyer vous-même vos textiles.",
    featured: false,
    badge: "",
    lines: [
      { label: "24 heures", price: "dès 60.-" },
      { label: "Week-end", price: "dès 115.-" },
      { label: "7 jours", price: "dès 180.-" },
      { label: "Livraison et reprise", price: "+ 35.-" },
      { label: "Pack produits pro", price: "+ 20.-" },
      { label: "Démonstration sur place", price: "+ 30.-" },
    ],
  },
] as const;
