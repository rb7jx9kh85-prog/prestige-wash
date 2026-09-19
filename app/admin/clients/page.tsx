import { requireAdmin } from "@/lib/admin/guard";
import { getCustomers } from "@/lib/admin/queries";
import { Empty } from "@/components/admin/bits";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAdmin();
  const { customers, bookings } = await getCustomers();

  const stats = new Map<string, { count: number; revenue: number; last: string | null }>();
  bookings.forEach((booking) => {
    const current = stats.get(booking.customer_id) ?? { count: 0, revenue: 0, last: null };
    current.count += 1;
    if (booking.status === "completed") current.revenue += booking.price_estimate;
    if (!current.last || booking.scheduled_date > current.last) current.last = booking.scheduled_date;
    stats.set(booking.customer_id, current);
  });

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Clients</h1>
          <p>{customers.length} fiche(s) · créées automatiquement à la première réservation</p>
        </div>
      </header>

      <section className="pan">
        <div className="pan__body pan__body--flush">
          {customers.length === 0 ? (
            <Empty>Aucun client enregistré pour le moment.</Empty>
          ) : (
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Adresse</th>
                    <th>Rendez-vous</th>
                    <th>Chiffre réalisé</th>
                    <th>Dernier RDV</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const stat = stats.get(customer.id) ?? { count: 0, revenue: 0, last: null };
                    return (
                      <tr key={customer.id}>
                        <td>
                          <b>{customer.first_name} {customer.last_name}</b>
                          <small>Depuis le {new Date(customer.created_at).toLocaleDateString("fr-CH")}</small>
                        </td>
                        <td>
                          <a className="ref" href={`mailto:${customer.email}`}>{customer.email}</a>
                          <small>{customer.phone}</small>
                        </td>
                        <td>
                          {customer.city}
                          <small>{customer.address} {customer.postal_code}</small>
                        </td>
                        <td><b>{stat.count}</b></td>
                        <td><b>{stat.revenue}.-</b></td>
                        <td>{stat.last ? new Date(stat.last).toLocaleDateString("fr-CH") : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
