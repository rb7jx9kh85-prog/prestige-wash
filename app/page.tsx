import { getSiteContent } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { Cursor, Preloader, ScrollProgress, SmoothScroll } from "@/components/ui/chrome";
import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Ticker } from "@/components/site/ticker";
import { Results } from "@/components/site/results";
import { Services } from "@/components/site/services";
import { Method } from "@/components/site/method";
import { Gallery } from "@/components/site/gallery";
import { Tariffs } from "@/components/site/tariffs";
import { Zone } from "@/components/site/zone";
import { Reviews } from "@/components/site/reviews";
import { FaqSection } from "@/components/site/faq";
import { CallToAction, SiteFooter, WhatsAppFloat } from "@/components/site/closing";

export const revalidate = 300;

export default async function HomePage() {
  const { services, gallery, faqs, testimonials } = await getSiteContent();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND.name,
    slogan: BRAND.tagline,
    description: BRAND.pitch,
    telephone: BRAND.phone,
    areaServed: BRAND.region,
    geo: { "@type": "GeoCoordinates", latitude: BRAND.map.lat, longitude: BRAND.map.lng },
    priceRange: "CHF 60 – 300",
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      name: service.name,
      description: service.description,
      priceCurrency: "CHF",
      price: service.price_from,
    })),
  };

  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      <SiteNav />

      <main>
        <Hero />
        <Ticker />
        <Results />
        <Services services={services} />
        <Method />
        <Gallery items={gallery} />
        <Tariffs />
        <Zone />
        <Reviews testimonials={testimonials} />
        <FaqSection faqs={faqs} />
        <CallToAction />
      </main>

      <SiteFooter />
      <WhatsAppFloat />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
