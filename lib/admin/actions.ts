"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { BookingStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/format";

const TIMESTAMP_FOR: Partial<Record<BookingStatus, string>> = {
  confirmed: "confirmed_at",
  completed: "completed_at",
  cancelled: "cancelled_at",
};

export async function setBookingStatus(bookingId: string, status: BookingStatus) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  const stamp = TIMESTAMP_FOR[status];
  if (stamp) patch[stamp] = new Date().toISOString();

  const { error } = await supabase.from("bookings").update(patch).eq("id", bookingId);
  if (error) return { error: error.message };

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    kind: "status",
    message: `Statut passé à « ${STATUS_LABELS[status]} ».`,
    actor: admin.displayName,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath("/admin/calendrier");
  return { ok: true };
}

export async function saveAdminNotes(bookingId: string, notes: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ admin_notes: notes.slice(0, 2000) })
    .eq("id", bookingId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/reservations/${bookingId}`);
  return { ok: true };
}

export async function markDepositRefunded(bookingId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ deposit_status: "refunded" })
    .eq("id", bookingId);
  if (error) return { error: error.message };

  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("booking_id", bookingId)
    .eq("status", "paid");

  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    kind: "deposit_refunded",
    message: "Acompte marqué comme remboursé.",
    actor: admin.displayName,
  });

  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath("/admin/paiements");
  return { ok: true };
}

export async function saveService(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("services")
    .update({
      name: String(formData.get("name") ?? "").slice(0, 120),
      description: String(formData.get("description") ?? "").slice(0, 600),
      price_from: Number(formData.get("price_from") ?? 0),
      duration_min: Number(formData.get("duration_min") ?? 60),
      is_active: formData.get("is_active") === "on",
      is_bookable: formData.get("is_bookable") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestations");
  revalidatePath("/");
}

export async function saveBusinessHours(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    is_open: formData.get(`open-${weekday}`) === "on",
    open_time: String(formData.get(`from-${weekday}`) || "08:00"),
    close_time: String(formData.get(`to-${weekday}`) || "18:00"),
    slot_minutes: Number(formData.get(`step-${weekday}`) || 30),
  }));

  const { error } = await supabase.from("business_hours").upsert(rows, { onConflict: "weekday" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilites");
}

export async function addClosure(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const day = String(formData.get("day") ?? "");
  if (!day) return;

  const { error } = await supabase
    .from("availability_exceptions")
    .upsert(
      { day, is_closed: true, reason: String(formData.get("reason") ?? "").slice(0, 200) },
      { onConflict: "day" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilites");
}

export async function removeClosure(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilites");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/connexion");
}
