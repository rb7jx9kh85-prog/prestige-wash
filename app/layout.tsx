import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigewash.ch"),
  title: "Prestige Wash | Nettoyage automobile & textile en Valais",
  description:
    "Nettoyage automobile et textile à domicile dans tout le Valais. Un résultat professionnel, directement chez vous.",
  openGraph: {
    title: "Prestige Wash — L’excellence dans chaque détail",
    description: "Nettoyage automobile & textile à domicile en Valais.",
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
