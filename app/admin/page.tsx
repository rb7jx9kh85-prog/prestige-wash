import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getDashboard } from "@/lib/admin/queries";
import { Empty, Kpi, StatusChip } from "@/components/admin/bits";
import { SignOutButton } from "@/components/admin/sign-out";
import { fromISODate, hhmm, longDate, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const { today, upcoming, recent, all, error } = await getDashboard();

  const active = all.filter((b) => !["cancelled", "no_show"].includes(b.status));
  const depositsPaid = all.filter((b) => b.deposit_status === "paid");
  const revenue = active
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.price_estimate, 0);
  const pending = all.filter((b) => b.status === "pending").length;

  // Six derniers mois, du plus ancien au plus récent.
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString("fr-CH", { month: "short" }),
      count: active.filter((b) => b.scheduled_date.startsWith(key)).length,
    };
  });
  const peak = Math.max(1, ...months.map((m) => m.count));

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Bonjour, {admin.displayName}</h1>
          <p>{longDate.format(new Date())} · {today.length} intervention(s) prévue(s) aujourd’hui</p>
        </div>
        <SignOutButton />
      </header>

      {error && <div className="alert" style={{ marginBottom: 22 }}>Lecture impossible : {error}</div>}

      <div className="kpis">
        <Kpi label="À traiter" value={pending} hint="Demandes en attente de confirmation" accent={pending > 0} />
        <Kpi label="Aujourd’hui" value={today.length} hint="Interventions planifiées" />
        <Kpi label="Acomptes encaissés" value={`${depositsPaid.reduce((s, b) => s + b.deposit_amount, 0)}.-`} hint={`${depositsPaid.length} paiement(s) de démonstration`} />
        <Kpi label="Chiffre réalisé" value={`${revenue}.-`} hint="Interventions terminées, 6 derniers mois" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 22, alignItems: "start" }} className="dash-cols">
        <section className="pan">
          <div className="pan__head">
            <h2>Agenda du jour</h2>
            <Link className="act" href="/admin/calendrier">Voir le calendrier</Link>
          </div>
          <div className="pan__body">
            {today.length === 0 ? (
              <Empty>Aucune intervention planifiée aujourd’hui.</Empty>
            ) : (
              <div className="agenda">
                {today.map((booking) => (
                  <Link className="agenda__row" key={booking.id} href={`/admin/reservations/${booking.id}`}>
                    <span className="agenda__time">
                      {hhmm(booking.start_time)}
                      <small>→ {hhmm(booking.end_time)}</small>
                    </span>
                    <span>
                      <b>{booking.service_name}</b>
                      <small style={{ display: "block", color: "var(--muted-2)", fontSize: 12 }}>
                        {booking.customers?.first_name} {booking.customers?.last_name} · {booking.address}, {booking.city}
                      </small>
                    </span>
                    <StatusChip status={booking.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pan">
          <div className="pan__head">
            <h2>Volume mensuel</h2>
            <p>Rendez-vous actifs</p>
          </div>
          <div className="pan__body">
            <div className="chart">
              {months.map((month, index) => (
                <div className="chart__col" key={month.key}>
                  <span className="chart__val">{month.count}</span>
                  <span
                    className="chart__bar"
                    data-empty={month.count === 0}
                    style={{
                      height: `${Math.max(4, (month.count / peak) * 132)}px`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  />
                  <span className="chart__lbl">{month.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="pan">
        <div className="pan__head">
          <h2>Prochains rendez-vous</h2>
          <Link className="act" href="/admin/reservations">Toutes les réservations</Link>
        </div>
        <div className="pan__body pan__body--flush">
          {upcoming.length === 0 ? (
            <Empty>Aucun rendez-vous à venir dans les 30 prochains jours.</Empty>
          ) : (
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Prestation</th>
                    <th>Client</th>
                    <th>Lieu</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link className="ref" href={`/admin/reservations/${booking.id}`}>
                          {booking.reference}
                        </Link>
                      </td>
                      <td>
                        <b>{shortDate.format(fromISODate(booking.scheduled_date))}</b>
                        <small>{hhmm(booking.start_time)} → {hhmm(booking.end_time)}</small>
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
                        <small>{booking.address}</small>
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

      <section className="pan">
        <div className="pan__head">
          <h2>Dernières demandes reçues</h2>
        </div>
        <div className="pan__body pan__body--flush">
          {recent.length === 0 ? (
            <Empty>
              Aucune réservation pour le moment. Testez le tunnel depuis{" "}
              <Link href="/reservation" className="ref">la page de réservation</Link>.
            </Empty>
          ) : (
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Reçue le</th>
                    <th>Intervention</th>
                    <th>Montant</th>
                    <th>Acompte</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link className="ref" href={`/admin/reservations/${booking.id}`}>
                          {booking.reference}
                        </Link>
                      </td>
                      <td>{new Date(booking.created_at).toLocaleDateString("fr-CH")}</td>
                      <td>
                        {shortDate.format(fromISODate(booking.scheduled_date))} · {hhmm(booking.start_time)}
                        <small>{booking.service_name}</small>
                      </td>
                      <td><b>{booking.price_estimate}.-</b></td>
                      <td>
                        <span className="chip" data-s={booking.deposit_status}>
                          {booking.deposit_amount}.-
                        </span>
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
