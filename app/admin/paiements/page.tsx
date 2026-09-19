import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getPayments } from "@/lib/admin/queries";
import { Empty, Kpi, PaymentChip } from "@/components/admin/bits";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdmin();
  const payments = await getPayments();

  const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Acomptes</h1>
          <p>Acomptes de réservation encaissés à la confirmation du rendez-vous</p>
        </div>
      </header>

      <div className="alert" style={{ marginTop: 0, marginBottom: 22, borderColor: "rgba(255,176,32,.35)", background: "rgba(255,176,32,.08)", color: "#ffd27a" }}>
        Mode démonstration : ces paiements sont simulés. Aucun encaissement réel n’a lieu et
        aucune donnée bancaire n’est transmise à un prestataire. Pour passer en production,
        branchez un vrai prestataire (Stripe, Datatrans, TWINT) à la place de{" "}
        <code>register_demo_payment</code>.
      </div>

      <div className="kpis">
        <Kpi label="Encaissé" value={`${collected}.-`} hint={`${payments.filter((p) => p.status === "paid").length} acompte(s)`} accent />
        <Kpi label="Remboursé" value={`${refunded}.-`} hint={`${payments.filter((p) => p.status === "refunded").length} remboursement(s)`} />
        <Kpi label="Net" value={`${collected - refunded}.-`} hint="Encaissé moins remboursé" />
      </div>

      <section className="pan">
        <div className="pan__body pan__body--flush">
          {payments.length === 0 ? (
            <Empty>Aucun acompte enregistré pour le moment.</Empty>
          ) : (
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Réservation</th>
                    <th>Montant</th>
                    <th>Moyen</th>
                    <th>Référence</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{dateTime.format(new Date(payment.created_at))}</td>
                      <td>
                        <Link className="ref" href={`/admin/reservations/${payment.booking_id}`}>
                          {payment.bookings?.reference ?? "—"}
                        </Link>
                        <small>{payment.bookings?.service_name}</small>
                      </td>
                      <td><b>{payment.amount}.- {payment.currency}</b></td>
                      <td>
                        {payment.card_brand} ••••{payment.card_last4}
                        <small>{payment.cardholder}</small>
                      </td>
                      <td>
                        {payment.provider_reference}
                        {payment.is_demo && <small><span className="chip chip--demo">Démo</span></small>}
                      </td>
                      <td><PaymentChip status={payment.status} /></td>
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
