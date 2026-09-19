import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminPassword, isValidSessionToken } from "@/lib/admin-auth";
import { sendBookingAccepted, sendBookingRefused, type BookingEmailData } from "@/lib/email";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/config";

const actions = {
  accept: { status: "confirmed", send: sendBookingAccepted },
  refuse: { status: "cancelled", send: sendBookingRefused },
} as const;

export async function POST(request: Request) {
  const store = await cookies();
  if (!isValidSessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  }

  const password = getAdminPassword();
  if (!password) return NextResponse.json({ error: "ADMIN_PASSWORD n’est pas configurée." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const action = body?.action as keyof typeof actions | undefined;
  const bookingNumber = typeof body?.booking_number === "string" ? body.booking_number : "";
  if (!action || !(action in actions) || !bookingNumber) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseSecretKey() ?? getSupabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("admin_update_booking_status", {
    p_password: password,
    p_booking_number: bookingNumber,
    p_status: actions[action].status,
  });

  if (error) {
    const message =
      error.code === "23P01"
        ? "Un autre rendez-vous est déjà confirmé sur ce créneau."
        : "Mise à jour impossible. Vérifiez la configuration Supabase.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const booking = data as BookingEmailData;
  const mail = await actions[action].send(booking);
  return NextResponse.json({ status: booking.status, email: mail });
}
