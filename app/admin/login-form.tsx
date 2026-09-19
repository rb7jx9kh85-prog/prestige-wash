"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function login(event: FormEvent) {
    event.preventDefault(); setError(""); const client = createClient();
    if (!client) return setError("Ajoutez les variables Supabase pour activer l’administration.");
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error) setError("Identifiants incorrects."); else window.location.reload();
  }
  return <form className="admin-login" onSubmit={login}><span>ESPACE PRIVÉ</span><h1>Administration</h1><p>Gérez les demandes reçues par Prestige Wash.</p><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <strong>{error}</strong>}<button>Se connecter</button><a href="/">← Retour au site</a></form>;
}
