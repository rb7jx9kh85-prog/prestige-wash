"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }
  return (
    <button type="button" className="admin-logout" onClick={logout}>
      Se déconnecter
    </button>
  );
}
