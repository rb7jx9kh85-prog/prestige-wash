import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Car Detailion | Detailing automobile à Renens (VD)",
  description:
    "Chaque voiture mérite un soin d'exception. Préparation esthétique, polissage, correction de peinture et traitements céramique à Renens, dans le canton de Vaud.",
  openGraph: {
    title: "Car Detailion — L’excellence du détail automobile",
    description:
      "Detailing automobile à Renens : lavage, soin du cuir, polissage, correction de peinture et protection céramique.",
    locale: "fr_CH",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
