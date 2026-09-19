import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type AdminSession = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

/**
 * Vérifie que l'utilisateur connecté figure bien dans `admin_profiles`.
 * Les politiques RLS refusent de toute façon les données sans ce profil ;
 * ce contrôle permet d'afficher un message compréhensible.
 */
export async function requireAdmin(): Promise<AdminSession> {
  if (!isSupabaseConfigured) redirect("/admin/connexion");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/connexion");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("display_name, role")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/admin/connexion?erreur=profil");

  return {
    userId: auth.user.id,
    email: auth.user.email ?? "",
    displayName: profile.display_name,
    role: profile.role,
  };
}
