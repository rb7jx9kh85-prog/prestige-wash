import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getBookings } from "@/lib/admin/queries";
import { Empty, StatusChip } from "@/components/admin/bits";
import { STATUS_LABELS, fromISODate, hhmm, humanDuration, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; depuis?: string }>;
}) {
  await requireAdmin();
  const { statut = "all", q = "", depuis = "" } = await searchParams;
  const { bookings, error } = await getBookings({ status: statut, search: q, from: depuis });

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Réservations</h1>
          <p>{bookings.length} résultat(s) · 200 lignes au maximum</p>
        </div>
      </header>

      <section className="pan">
        <div className="pan__head">
          <form className="filters" method="get">
            <input name="q" defaultValue={q} placeholder="Référence, ville, prestation…" aria-label="Rechercher" />
            <select name="statut" defaultValue={statut} aria-label="Filtrer par statut">
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "Tous les statuts" : STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <input type="date" name="depuis" defaultValue={depuis} aria-label="À partir du" />
            <button className="act" type="submit">Filtrer</button>
            <Link className="act" href="/admin/reservations">Réinitialiser</Link>
          </form>
        </div>

        <div className="pan__body pan__body--flush">
          {error && <div className="empty">Lecture impossible : {error}</div>}
          {!error && bookings.length === 0 ? (
            <Empty>Aucune réservation ne correspond à ces critères.</Empty>
          ) : (
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Intervention</th>
                    <th>Prestation</th>
                    <th>Client</th>
                    <th>Adresse</th>
                    <th>Montant</th>
                    <th>Acompte</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link className="ref" href={`/admin/reservations/${booking.id}`}>
                          {booking.reference}
                        </Link>
                        <small>{new Date(booking.created_at).toLocaleDateString("fr-CH")}</small>
                      </td>
                      <td>
                        <b>{shortDate.format(fromISODate(booking.scheduled_date))}</b>
                        <small>{hhmm(booking.start_time)} · {humanDuration(booking.duration_min)}</small>
                      </td>
                      <td>
                        {booking.service_name}
                        {booking.vehicle_label && <small>{booking.vehicle_label}</small>}
                      </td>
                      <td>
                        {booking.customers?.first_name} {booking.customers?.last_name}
                        <small>{booking.customers?.phone}</small>
                      </td>
                      <td>
                        {booking.city}
                        <small>{booking.address} {booking.postal_code}</small>
                      </td>
                      <td><b>{booking.price_estimate}.-</b></td>
                      <td>
                        <span className="chip" data-s={booking.deposit_status}>{booking.deposit_amount}.-</span>
                      </td>
                      <td><StatusChip status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
