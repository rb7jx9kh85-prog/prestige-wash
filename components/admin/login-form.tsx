"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "Adresse e-mail ou mot de passe incorrect."
          : authError.message,
      );
      setBusy(false);
      return;
    }

    router.replace(next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="fields" style={{ gridTemplateColumns: "1fr" }}>
      <div className="field">
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && <div className="alert" style={{ marginTop: 0 }}>{error}</div>}
      <button className="btn btn--primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
        {busy ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
