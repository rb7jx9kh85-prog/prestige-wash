import type { Metadata, Viewport } from "next";
import { Oswald, Open_Sans } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";
import "./site.css";
import "./booking.css";
import "./admin.css";

const display = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/**
 * `??` ne se replie pas sur une chaîne vide : or Vercel peut très bien
 * définir NEXT_PUBLIC_SITE_URL="" plutôt que de l'omettre, ce qui faisait
 * échouer le build sur `new URL('')`. On se protège aussi d'une valeur
 * malformée pour ne jamais bloquer le build sur ce champ, purement cosmétique.
 */
function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(raw || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: `${BRAND.name} — ${BRAND.subtitle}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.pitch,
  keywords: [
    "nettoyage automobile Valais",
    "nettoyage intérieur voiture Sion",
    "nettoyage canapé à domicile",
    "nettoyage matelas Valais",
    "location injecteur extracteur",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.pitch,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04070b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
