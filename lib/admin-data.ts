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
  email: string | null;
  service: string;
  vehicle: string | null;
  notes: string | null;
};

/**
 * Lit les demandes de rendez-vous.
 * Avec `SUPABASE_SECRET_KEY`, la lecture est directe. Sinon, elle passe par la
 * fonction `admin_bookings`, protégée par le mot de passe d'administration.
 */
export type BookingsResult = {
  bookings: AdminBooking[];
  error?: string;
  /** Requête SQL à exécuter dans Supabase pour rétablir l'accès. */
  fix?: string;
};

export async function fetchBookings(): Promise<BookingsResult> {
  const url = getSupabaseUrl();
  const secret = getSupabaseSecretKey();

  if (secret) {
    const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_number,start_at,status,location,customer_notes,customers(first_name,last_name,phone,email),services(name),vehicles(label)")
      .order("start_at", { ascending: true })
      .limit(100);
    if (!error && data) {
      const first = <T,>(value: T | T[] | null): T | null =>
        Array.isArray(value) ? (value[0] ?? null) : value;
      return {
        bookings: data.map((row) => {
          const customer = first(row.customers as unknown as { first_name: string; last_name: string | null; phone: string; email: string | null } | null);
          return {
            booking_number: row.booking_number,
            start_at: row.start_at,
            status: row.status,
            location: row.location,
            customer_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
            phone: customer?.phone ?? "",
            email: customer?.email ?? null,
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
    // Ne pas presumer de la cause : afficher l'erreur reelle renvoyee par Supabase.
    const unauthorized = error.code === "28000" || /unauthorized/i.test(error.message ?? "");
    if (unauthorized) {
      return {
        bookings: [],
        error:
          "Supabase a refusé la lecture : le mot de passe enregistré en base ne correspond pas à ADMIN_PASSWORD. " +
          "Déconnectez-vous puis reconnectez-vous (la base apprend le mot de passe à la connexion), " +
          "ou exécutez cette ligne dans le SQL Editor de Supabase :",
        fix: "select public.admin_set_password('VOTRE_MOT_DE_PASSE');",
      };
    }
    return {
      bookings: [],
      error: `Lecture des demandes impossible. Supabase a répondu : ${error.message ?? "erreur inconnue"}`,
      fix: error.code ? `Code d’erreur : ${error.code}` : undefined,
    };
  }
  return { bookings: (data ?? []) as AdminBooking[] };
}

export type StatusUpdate = { booking: BookingEmailDataLike; error?: string; code?: string };
type BookingEmailDataLike = {
  booking_number: string;
  status: string;
  start_at: string;
  customer_name: string;
  email: string | null;
  phone: string;
  service: string;
  vehicle: string | null;
  location: string | null;
};

/**
 * Change le statut d'une demande.
 * Avec `SUPABASE_SECRET_KEY`, la mise à jour est directe : elle ne dépend alors
 * pas du mot de passe enregistré en base. Sinon elle passe par `admin_update_booking_status`.
 */
export async function updateBookingStatus(
  bookingNumber: string,
  status: "confirmed" | "cancelled",
): Promise<{ booking?: BookingEmailDataLike; error?: string; code?: string }> {
  const url = getSupabaseUrl();
  const secret = getSupabaseSecretKey();

  if (secret) {
    const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("booking_number", bookingNumber);
    if (error) return { error: error.message, code: error.code };
    const { data } = await supabase
      .from("bookings")
      .select("booking_number,start_at,status,location,customers(first_name,last_name,phone,email),services(name),vehicles(label)")
      .eq("booking_number", bookingNumber)
      .maybeSingle();
    if (data) {
      const pick = <T,>(value: T | T[] | null): T | null => (Array.isArray(value) ? (value[0] ?? null) : value);
      const customer = pick(data.customers as unknown as { first_name: string; last_name: string | null; phone: string; email: string | null } | null);
      return {
        booking: {
          booking_number: data.booking_number,
          status: data.status,
          start_at: data.start_at,
          customer_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
          email: customer?.email ?? null,
          phone: customer?.phone ?? "",
          service: pick(data.services as unknown as { name: string } | null)?.name ?? "",
          vehicle: pick(data.vehicles as unknown as { label: string } | null)?.label ?? null,
          location: data.location,
        },
      };
    }
  }

  const password = getAdminPassword();
  if (!password) return { error: "ADMIN_PASSWORD n’est pas configurée." };
  const supabase = createClient(url, getSupabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("admin_update_booking_status", {
    p_password: password,
    p_booking_number: bookingNumber,
    p_status: status,
  });
  if (error) return { error: error.message, code: error.code };
  return { booking: data as BookingEmailDataLike };
}
