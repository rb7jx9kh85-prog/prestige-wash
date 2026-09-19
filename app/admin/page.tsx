import { cookies } from "next/headers";
import LoginForm from "./login-form";
import LogoutButton from "./logout-button";
import { ADMIN_COOKIE, getAdminPassword, isValidSessionToken } from "@/lib/admin-auth";
import { fetchBookings } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  pending: "À confirmer",
  pending_payment: "Paiement en attente",
  confirmed: "Confirmée",
  rescheduled: "Replanifiée",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "Absent",
};

export default async function AdminPage() {
  const store = await cookies();
  const authenticated = isValidSessionToken(store.get(ADMIN_COOKIE)?.value);

  if (!authenticated) {
    return (
      <div className="admin-page">
        <LoginForm configured={Boolean(getAdminPassword())} />
      </div>
    );
  }

  const { bookings, error, fix } = await fetchBookings();

  return (
    <div className="admin-page">
      <div className="admin-dashboard">
        <header>
          <div>
            <span>CAR DETAILION</span>
            <h1>Demandes de rendez-vous</h1>
          </div>
          <div className="admin-actions">
            <a href="/">Voir le site ↗</a>
            <LogoutButton />
          </div>
        </header>
        <section>
          <small>APERÇU</small>
          <h2>{bookings.length} demande{bookings.length > 1 ? "s" : ""}</h2>
          {error && (
            <div className="admin-error">
              <p>{error}</p>
              {fix && <pre>{fix}</pre>}
            </div>
          )}
          <div className="admin-list">
            {bookings.length ? (
              bookings.map((booking) => (
                <article key={booking.booking_number}>
                  <div>
                    <strong>{booking.booking_number}</strong>
                    <span>
                      {new Date(booking.start_at).toLocaleString("fr-CH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Zurich",
                      })}
                    </span>
                  </div>
                  <div>
                    <strong>{booking.service}</strong>
                    <span>
                      {booking.customer_name} · {booking.phone}
                      {booking.vehicle ? ` · ${booking.vehicle}` : ""}
                      {booking.location ? ` · ${booking.location}` : ""}
                    </span>
                  </div>
                  <i>{statusLabels[booking.status] ?? booking.status}</i>
                </article>
              ))
            ) : (
              <p>Aucune demande pour le moment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
