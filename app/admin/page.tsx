import LoginForm from "./login-form";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const client = await createClient();
  if (!client) return <div className="admin-page"><LoginForm /></div>;
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <div className="admin-page"><LoginForm /></div>;
  const { data: profile } = await client.from("admin_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!profile) return <div className="admin-page"><LoginForm /></div>;
  const { data: bookings } = await client.from("bookings").select("booking_number,start_at,status,location,customers(first_name,last_name,phone),services(name)").order("start_at", { ascending: true }).limit(50);
  return <div className="admin-page"><div className="admin-dashboard"><header><div><span>PRESTIGE WASH</span><h1>Bonjour, {profile.display_name}</h1></div><a href="/">Voir le site ↗</a></header><section><small>APERÇU</small><h2>Demandes récentes</h2><div className="admin-list">{bookings?.length ? bookings.map((booking) => <article key={booking.booking_number}><div><strong>{booking.booking_number}</strong><span>{new Date(booking.start_at).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Zurich" })}</span></div><div><strong>{Array.isArray(booking.services) ? booking.services[0]?.name : (booking.services as {name?: string} | null)?.name}</strong><span>{booking.location}</span></div><i>{booking.status}</i></article>) : <p>Aucune demande pour le moment.</p>}</div></section></div></div>;
}
