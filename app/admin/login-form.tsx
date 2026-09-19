"use client";

import { FormEvent, useState } from "react";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Mot de passe incorrect.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login" onSubmit={login}>
      <span>ESPACE PRIVÉ</span>
      <h1>Administration</h1>
      <p>Gérez les demandes reçues par Car Detailion.</p>
      <label>
        Mot de passe
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          required
        />
      </label>
      {!configured && <strong>Ajoutez la variable ADMIN_PASSWORD dans Vercel pour activer l’accès.</strong>}
      {error && <strong>{error}</strong>}
      <button disabled={loading}>{loading ? "Vérification…" : "Se connecter"}</button>
      <a href="/">← Retour au site</a>
    </form>
  );
}
