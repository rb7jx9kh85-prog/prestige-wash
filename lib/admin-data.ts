import { createClient } from "@supabase/supabase-js";
import { getAdminPassword } from "./admin-auth";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "./supabase/config";

export type AdminBooking = {
  booking_number: string;
  start_at: string;
  status: string;
  location: string;
  customer_name: string;
  phone: string;
  service: string;
  vehicle: string | null;
  notes: string | null;
};

/**
 * Lit les demandes de rendez-vous.
 * Avec `SUPABASE_SECRET_KEY`, la lecture est directe. Sinon, elle passe par la
 * fonction `admin_bookings`, protégée par le mot de passe d'administration.
 */
export async function fetchBookings(): Promise<{ bookings: AdminBooking[]; error?: string }> {
  const url = getSupabaseUrl();
  const secret = getSupabaseSecretKey();

  if (secret) {
    const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_number,start_at,status,location,customer_notes,customers(first_name,last_name,phone),services(name),vehicles(label)")
      .order("start_at", { ascending: true })
      .limit(100);
    if (!error && data) {
      const first = <T,>(value: T | T[] | null): T | null =>
        Array.isArray(value) ? (value[0] ?? null) : value;
      return {
        bookings: data.map((row) => {
          const customer = first(row.customers as unknown as { first_name: string; last_name: string | null; phone: string } | null);
          return {
            booking_number: row.booking_number,
            start_at: row.start_at,
            status: row.status,
            location: row.location,
            customer_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
            phone: customer?.phone ?? "",
            service: first(row.services as unknown as { name: string } | null)?.name ?? "",
            vehicle: first(row.vehicles as unknown as { label: string } | null)?.label ?? null,
            notes: row.customer_notes,
          };
        }),
      };
    }
  }

  const password = getAdminPassword();
  if (!password) return { bookings: [], error: "ADMIN_PASSWORD n’est pas configurée." };

  const supabase = createClient(url, getSupabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("admin_bookings", { p_password: password });
  if (error) {
    return {
      bookings: [],
      error:
        "Lecture des demandes impossible. Vérifiez que le mot de passe enregistré dans Supabase correspond à ADMIN_PASSWORD.",
    };
  }
  return { bookings: (data ?? []) as AdminBooking[] };
}
