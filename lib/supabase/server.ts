import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

/**
 * Client Supabase côté serveur adossé aux cookies de session : les lectures
 * de l'espace d'administration passent donc par les politiques RLS.
 */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le middleware rafraîchit la session.
        }
      },
    },
  });
}

/** Client en lecture seule, sans session, pour les données publiques. */
export function createPublicClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export { isSupabaseConfigured };
