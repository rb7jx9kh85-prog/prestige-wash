import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

export async function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(items) {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Cookies may be read-only inside a Server Component. */ }
      },
    },
  });
}
