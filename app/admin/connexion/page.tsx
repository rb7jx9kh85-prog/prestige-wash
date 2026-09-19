import { Monogram } from "@/components/ui/logo";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;

  return (
    <div className="login">
      <span className="glow login__glow" aria-hidden />
      <div className="login__box">
        <Monogram style={{ width: 44, height: 44 }} />
        <h1>Espace administration</h1>
        <p>Gestion des rendez-vous, des acomptes et du catalogue Prestige Wash.</p>

        {erreur === "profil" && (
          <div className="alert" style={{ marginBottom: 22, marginTop: 0 }}>
            Ce compte n’a pas de profil administrateur. Ajoutez son identifiant dans la
            table <code>admin_profiles</code>.
          </div>
        )}

        {isSupabaseConfigured ? (
          <LoginForm next={suite ?? "/admin"} />
        ) : (
          <div className="note">
            Supabase n’est pas configuré. Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> dans <code>.env.local</code>,
            appliquez les migrations, puis créez un utilisateur dans Supabase Auth et
            ajoutez son UUID dans <code>admin_profiles</code>.
          </div>
        )}
      </div>
    </div>
  );
}
