import type { Metadata } from "next";
import Link from "next/link";
import { getBookingCatalog } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { BookingWizard } from "@/components/booking/wizard";
import { Cursor, ScrollProgress, SmoothScroll } from "@/components/ui/chrome";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/closing";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description: `Réservez une intervention ${BRAND.short} en Valais : prestation, créneau et acompte de ${BRAND.depositAmount} CHF déduit du montant final.`,
};

export const dynamic = "force-dynamic";

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const { services, options, variants, connected } = await getBookingCatalog();
  const initial = services.some((item) => item.slug === service) ? (service as string) : null;

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      <SiteNav />

      <main className="bk">
        <span className="glow bk__glow" aria-hidden />
        <div className="shell" style={{ position: "relative", zIndex: 1 }}>
          <Link className="bk__back" href="/">
            ← Retour au site
          </Link>
          <p className="eyebrow">Réservation en ligne</p>
          <h1 className="display display--sm" style={{ marginBottom: 40 }}>
            Prendre <em>rendez-vous</em>
          </h1>

          <BookingWizard
            services={services}
            options={options}
            variants={variants}
            initialService={initial}
            connected={connected}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
