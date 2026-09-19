/**
 * Configuration Supabase.
 *
 * L'URL et la clé publiable sont des valeurs publiques (exposées au navigateur).
 * Elles servent de repli pour que le site reste fonctionnel même si les variables
 * ne sont pas encore renseignées dans Vercel ; toute variable définie a la priorité.
 *
 * La clé secrète (`SUPABASE_SECRET_KEY`) n'est jamais stockée ici : elle se
 * configure uniquement dans les variables d'environnement côté serveur.
 */
const DEFAULT_SUPABASE_URL = "https://pbnniqdthncaphedvgej.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YC-MXCNOMHjIqiG6iFWadg_sybtPyw5";

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getSupabaseUrl() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? DEFAULT_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

/** Clé de service, uniquement côté serveur. */
export function getSupabaseSecretKey() {
  return clean(process.env.SUPABASE_SECRET_KEY);
}
