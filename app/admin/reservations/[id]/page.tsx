import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getBooking } from "@/lib/admin/queries";
import { PaymentChip, StatusChip } from "@/components/admin/bits";
import { BookingActions } from "@/components/admin/booking-actions";
import { dateTime, fromISODate, hhmm, humanDuration, longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="dl__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { booking, events, payments } = await getBooking(id);
  if (!booking) notFound();

  const customer = booking.customers;
  const optionsTotal = booking.options.reduce((sum, option) => sum + option.price, 0);

  return (
    <>
      <header className="adm__head">
        <div>
          <Link className="bk__back" href="/admin/reservations">← Toutes les réservations</Link>
          <h1>{booking.reference}</h1>
          <p>
            {longDate.format(fromISODate(booking.scheduled_date))} · {hhmm(booking.start_time)} →{" "}
            {hhmm(booking.end_time)} ({humanDuration(booking.duration_min)})
          </p>
        </div>
        <StatusChip status={booking.status} />
      </header>

      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        depositStatus={booking.deposit_status}
        adminNotes={booking.admin_notes}
      />

      <div className="detail">
        <div>
          <section className="pan">
            <div className="pan__head"><h2>Intervention</h2></div>
            <div className="pan__body">
              <dl className="dl">
                <Row label="Prestation">{booking.service_name}</Row>
                {booking.vehicle_label && <Row label="Formule">{booking.vehicle_label}</Row>}
                <Row label="Options">
                  {booking.options.length === 0
                    ? "Aucune"
                    : booking.options.map((option) => `${option.name} (+${option.price}.-)`).join(", ")}
                </Row>
                <Row label="Durée réservée">{humanDuration(booking.duration_min)}</Row>
                <Row label="Adresse">
                  {booking.address}
                  <br />
                  {booking.postal_code} {booking.city}
                </Row>
                {booking.access_notes && <Row label="Accès">{booking.access_notes}</Row>}
                {booking.customer_notes && <Row label="Précisions du client">{booking.customer_notes}</Row>}
                <Row label="Origine">{booking.source}</Row>
              </dl>
            </div>
          </section>

          <section className="pan">
            <div className="pan__head"><h2>Client</h2></div>
            <div className="pan__body">
              <dl className="dl">
                <Row label="Nom">{customer?.first_name} {customer?.last_name}</Row>
                <Row label="E-mail">
                  <a className="ref" href={`mailto:${customer?.email}`}>{customer?.email}</a>
                </Row>
                <Row label="Téléphone">
                  <a className="ref" href={`tel:${customer?.phone}`}>{customer?.phone}</a>
                </Row>
                <Row label="Adresse au dossier">
                  {customer?.address}, {customer?.postal_code} {customer?.city}
                </Row>
                <Row label="Client depuis">
                  {customer ? new Date(customer.created_at).toLocaleDateString("fr-CH") : "—"}
                </Row>
              </dl>
            </div>
          </section>
        </div>

        <div>
          <section className="pan">
            <div className="pan__head"><h2>Montants</h2></div>
            <div className="pan__body">
              <dl className="dl">
                <Row label="Prestation de base">{booking.price_estimate - optionsTotal}.-</Row>
                <Row label="Options">+ {optionsTotal}.-</Row>
                <Row label="Total estimé"><b>{booking.price_estimate}.- CHF</b></Row>
                <Row label="Acompte">
                  {booking.deposit_amount}.- <PaymentChip status={booking.deposit_status} />
                </Row>
                <Row label="Solde sur place">
                  <b>{Math.max(0, booking.price_estimate - booking.deposit_amount)}.- CHF</b>
                </Row>
              </dl>
            </div>
          </section>

          <section className="pan">
            <div className="pan__head"><h2>Paiements</h2></div>
            <div className="pan__body">
              {payments.length === 0 ? (
                <p style={{ color: "var(--muted-2)", fontSize: 13 }}>Aucun paiement enregistré.</p>
              ) : (
                <dl className="dl">
                  {payments.map((payment) => (
                    <Row key={payment.id} label={new Date(payment.created_at).toLocaleDateString("fr-CH")}>
                      {payment.amount}.- {payment.currency} · {payment.card_brand} ••••{payment.card_last4}
                      <br />
                      <span style={{ fontSize: 11.5, color: "var(--muted-2)" }}>{payment.provider_reference}</span>
                      {payment.is_demo && <span className="chip chip--demo" style={{ marginLeft: 8 }}>Démo</span>}
                    </Row>
                  ))}
                </dl>
              )}
            </div>
          </section>

          <section className="pan">
            <div className="pan__head"><h2>Historique</h2></div>
            <div className="pan__body">
              <div className="timeline">
                {events.map((event) => (
                  <div className="tl" key={event.id}>
                    <b>{event.message}</b>
                    <span>{dateTime.format(new Date(event.created_at))} · {event.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
