import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/config";

const serviceSlugs: Record<string, string> = {
  "Nettoyage automobile": "nettoyage-automobile",
  "Nettoyage textile": "nettoyage-textile",
  "Location de machine": "location-machine",
};

function text(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const url = getSupabaseUrl();
  // La clé secrète est préférée ; à défaut, la clé publiable suffit car la fonction
  // `create_booking_secure` est `security definer` et valide elle-même les données.
  const key = getSupabaseSecretKey() ?? getSupabasePublishableKey();
  if (!url || !key) return NextResponse.json({ error: "Réservation en ligne non configurée." }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const payload = {
    service: text(body.service, 80), vehicle: text(body.vehicle, 100), date: text(body.date, 10),
    time: text(body.time, 5), name: text(body.name, 100), phone: text(body.phone, 30),
    location: text(body.location, 100), notes: text(body.notes, 700),
  };
  if (!serviceSlugs[payload.service] || !payload.vehicle || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) || !/^\d{2}:\d{2}$/.test(payload.time) || payload.name.length < 2 || payload.phone.length < 8 || payload.location.length < 2) {
    return NextResponse.json({ error: "Informations incomplètes." }, { status: 422 });
  }
  const start = new Date(`${payload.date}T${payload.time}:00+02:00`);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) return NextResponse.json({ error: "Créneau invalide." }, { status: 422 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("create_booking_secure", {
    p_service_slug: serviceSlugs[payload.service], p_vehicle_label: payload.vehicle,
    p_start_at: start.toISOString(), p_full_name: payload.name, p_phone: payload.phone,
    p_location: payload.location, p_notes: payload.notes || null,
  });
  if (error) return NextResponse.json({ error: error.code === "23P01" ? "Ce créneau vient d’être réservé." : "Impossible d’enregistrer la demande." }, { status: 409 });
  return NextResponse.json({ booking: data }, { status: 201 });
}
