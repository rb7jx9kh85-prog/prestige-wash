import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/config";
import {
  ADMIN_COOKIE,
  createSessionToken,
  getAdminPassword,
  isValidPassword,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!getAdminPassword()) {
    return NextResponse.json({ error: "Aucun mot de passe configuré (ADMIN_PASSWORD)." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  // La base apprend le mot de passe à la première connexion réussie : plus aucune
  // synchronisation manuelle entre ADMIN_PASSWORD et Supabase.
  await bootstrapDatabasePassword(password);

  const token = createSessionToken();
  if (!token) return NextResponse.json({ error: "Session indisponible." }, { status: 503 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions);
  return response;
}

async function bootstrapDatabasePassword(password: string) {
  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseSecretKey() ?? getSupabasePublishableKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.rpc("admin_bootstrap_password", { p_password: password });
  } catch {
    /* L'échec n'empêche pas la connexion : la lecture affichera le message d'aide. */
  }
}
