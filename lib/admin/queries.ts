import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/format";
import type { Booking, Customer, Payment } from "@/lib/types";

const BOOKING_WITH_CUSTOMER =
  "*, customers ( id, first_name, last_name, email, phone, address, postal_code, city, notes, created_at )";

export async function getDashboard() {
  const supabase = await createClient();
  const today = toISODate(new Date());
  const horizon = toISODate(new Date(Date.now() + 30 * 86400000));
  const since = new Date(Date.now() - 180 * 86400000).toISOString();

  const [todayRows, upcomingRows, recentRows, allRows] = await Promise.all([
    supabase.from("bookings").select(BOOKING_WITH_CUSTOMER).eq("scheduled_date", today).order("start_time"),
    supabase
      .from("bookings")
      .select(BOOKING_WITH_CUSTOMER)
      .gt("scheduled_date", today)
      .lte("scheduled_date", horizon)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date")
      .order("start_time")
      .limit(8),
    supabase.from("bookings").select(BOOKING_WITH_CUSTOMER).order("created_at", { ascending: false }).limit(8),
    supabase
      .from("bookings")
      .select("status, price_estimate, deposit_amount, deposit_status, scheduled_date, created_at")
      .gte("created_at", since),
  ]);

  return {
    today: (todayRows.data as Booking[] | null) ?? [],
    upcoming: (upcomingRows.data as Booking[] | null) ?? [],
    recent: (recentRows.data as Booking[] | null) ?? [],
    all: (allRows.data as Pick<
      Booking,
      "status" | "price_estimate" | "deposit_amount" | "deposit_status" | "scheduled_date" | "created_at"
    >[] | null) ?? [],
    error: todayRows.error?.message ?? null,
  };
}

export async function getBookings(filters: { status?: string; search?: string; from?: string }) {
  const supabase = await createClient();
  let query = supabase.from("bookings").select(BOOKING_WITH_CUSTOMER);

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("scheduled_date", filters.from);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`reference.ilike.${term},city.ilike.${term},service_name.ilike.${term},address.ilike.${term}`);
  }

  const { data, error } = await query
    .order("scheduled_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(200);

  return { bookings: (data as Booking[] | null) ?? [], error: error?.message ?? null };
}

export async function getBooking(id: string) {
  const supabase = await createClient();
  const [booking, events, payments] = await Promise.all([
    supabase.from("bookings").select(BOOKING_WITH_CUSTOMER).eq("id", id).maybeSingle(),
    supabase.from("booking_events").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
  ]);

  return {
    booking: (booking.data as Booking | null) ?? null,
    events: events.data ?? [],
    payments: (payments.data as Payment[] | null) ?? [],
  };
}

export async function getMonthBookings(year: number, month: number) {
  const supabase = await createClient();
  const first = toISODate(new Date(year, month, 1));
  const last = toISODate(new Date(year, month + 1, 0));

  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_CUSTOMER)
    .gte("scheduled_date", first)
    .lte("scheduled_date", last)
    .order("start_time");

  return (data as Booking[] | null) ?? [];
}

export async function getCustomers() {
  const supabase = await createClient();
  const [customers, bookings] = await Promise.all([
    supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("bookings").select("customer_id, status, price_estimate, scheduled_date"),
  ]);

  return {
    customers: (customers.data as Customer[] | null) ?? [],
    bookings:
      (bookings.data as Pick<Booking, "customer_id" | "status" | "price_estimate" | "scheduled_date">[] | null) ?? [],
  };
}

export async function getPayments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, bookings ( reference, service_name, scheduled_date )")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as Payment[] | null) ?? [];
}
