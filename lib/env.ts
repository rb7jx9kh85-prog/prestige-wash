/**
 * Les variables Supabase sont lues au même endroit pour que l'application
 * puisse se construire — et afficher un message clair — même lorsqu'elles
 * ne sont pas encore renseignées.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
