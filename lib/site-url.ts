const FALLBACK_SITE_URL = "https://prestigewash.ch";

function normalize(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

/**
 * URL publique du site, tolérante aux variables vides ou sans protocole
 * (Vercel expose par exemple `VERCEL_URL` sous la forme `mon-site.vercel.app`).
 */
export function getSiteUrl() {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalize(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
    normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalize(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    normalize(process.env.VERCEL_URL) ??
    new URL(FALLBACK_SITE_URL)
  );
}
