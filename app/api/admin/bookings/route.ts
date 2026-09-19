import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminPassword, isValidSessionToken } from "@/lib/admin-auth";
import { sendBookingAccepted, sendBookingRefused, type BookingEmailData } from "@/lib/email";
import { updateBookingStatus } from "@/lib/admin-data";

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

  const { booking: updated, error, code } = await updateBookingStatus(bookingNumber, actions[action].status);

  if (error || !updated) {
    const message =
      code === "23P01"
        ? "Un autre rendez-vous est déjà confirmé sur ce créneau."
        : code === "28000" || /unauthorized/i.test(error ?? "")
          ? "Supabase a refusé la mise à jour : le mot de passe enregistré en base ne correspond pas à ADMIN_PASSWORD. Ajoutez SUPABASE_SECRET_KEY dans Vercel, ou exécutez select public.admin_set_password('<votre mot de passe>'); dans Supabase."
          : `Mise à jour impossible. ${error ?? ""}`.trim();
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const booking = updated as BookingEmailData;
  const mail = await actions[action].send(booking);
  return NextResponse.json({ status: booking.status, email: mail });
}
