"use client";

import { signOut } from "@/lib/admin/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="act" type="submit">Se déconnecter</button>
    </form>
  );
}
