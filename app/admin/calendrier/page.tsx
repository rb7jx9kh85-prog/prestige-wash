import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getMonthBookings } from "@/lib/admin/queries";
import { hhmm, toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

const DOW = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  await requireAdmin();
  const { m } = await searchParams;

  const now = new Date();
  const [year, month] = m
    ? m.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const cursor = new Date(year, month - 1, 1);

  const bookings = await getMonthBookings(cursor.getFullYear(), cursor.getMonth());
  const byDay = new Map<string, typeof bookings>();
  bookings.forEach((booking) => {
    const list = byDay.get(booking.scheduled_date) ?? [];
    list.push(booking);
    byDay.set(booking.scheduled_date, list);
  });

  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  // Grille de six semaines commençant un lundi.
  const start = new Date(cursor);
  start.setDate(1 - ((cursor.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
  const todayISO = toISODate(now);

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Calendrier</h1>
          <p>
            {cursor.toLocaleDateString("fr-CH", { month: "long", year: "numeric" })} ·{" "}
            {bookings.length} intervention(s)
          </p>
        </div>
        <div className="act-row">
          <Link className="act" href={`/admin/calendrier?m=${key(prev)}`}>‹ Mois précédent</Link>
          <Link className="act" href="/admin/calendrier">Aujourd’hui</Link>
          <Link className="act" href={`/admin/calendrier?m=${key(next)}`}>Mois suivant ›</Link>
        </div>
      </header>

      <div className="month">
        {DOW.map((label) => (
          <div className="month__dow" key={label}>{label.slice(0, 3)}</div>
        ))}
        {cells.map((date) => {
          const iso = toISODate(date);
          const items = byDay.get(iso) ?? [];
          return (
            <div
              className="month__cell"
              key={iso}
              data-out={date.getMonth() !== cursor.getMonth()}
              data-today={iso === todayISO}
            >
              <span className="month__num">{date.getDate()}</span>
              {items.map((booking) => (
                <Link
                  className="month__ev"
                  key={booking.id}
                  href={`/admin/reservations/${booking.id}`}
                  data-s={booking.status}
                  title={`${booking.reference} — ${booking.service_name} — ${booking.city}`}
                >
                  {hhmm(booking.start_time)} {booking.customers?.last_name ?? booking.service_name}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
