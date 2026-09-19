import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { addClosure, removeClosure, saveBusinessHours } from "@/lib/admin/actions";
import { hhmm } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

type Hours = {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slot_minutes: number;
};

type Closure = { id: string; day: string; reason: string; is_closed: boolean };

export default async function AvailabilityPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [hours, closures] = await Promise.all([
    supabase.from("business_hours").select("*").order("weekday"),
    supabase.from("availability_exceptions").select("*").order("day"),
  ]);

  const byWeekday = new Map<number, Hours>(
    ((hours.data as Hours[] | null) ?? []).map((row) => [row.weekday, row]),
  );
  const list = (closures.data as Closure[] | null) ?? [];

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Disponibilités</h1>
          <p>Ces horaires déterminent les créneaux proposés aux clients sur le site.</p>
        </div>
      </header>

      <section className="pan">
        <div className="pan__head">
          <h2>Horaires hebdomadaires</h2>
          <p>Le pas détermine l’espacement des créneaux proposés.</p>
        </div>
        <div className="pan__body">
          <form action={saveBusinessHours}>
            <div className="tbl__wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Ouvert</th>
                    <th>De</th>
                    <th>À</th>
                    <th>Pas (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                    const row = byWeekday.get(weekday);
                    return (
                      <tr key={weekday}>
                        <td><b>{DAYS[weekday]}</b></td>
                        <td>
                          <input type="checkbox" name={`open-${weekday}`} defaultChecked={row?.is_open ?? false} />
                        </td>
                        <td>
                          <input type="time" name={`from-${weekday}`} defaultValue={hhmm(row?.open_time ?? "08:00")} className="filters" style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "rgba(255,255,255,.03)" }} />
                        </td>
                        <td>
                          <input type="time" name={`to-${weekday}`} defaultValue={hhmm(row?.close_time ?? "18:00")} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "rgba(255,255,255,.03)" }} />
                        </td>
                        <td>
                          <input type="number" name={`step-${weekday}`} min={15} step={15} defaultValue={row?.slot_minutes ?? 30} style={{ width: 90, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "rgba(255,255,255,.03)" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="act-row" style={{ marginTop: 18 }}>
              <button className="act" type="submit">Enregistrer les horaires</button>
            </div>
          </form>
        </div>
      </section>

      <section className="pan">
        <div className="pan__head">
          <h2>Fermetures exceptionnelles</h2>
          <p>Vacances, jours fériés, journées bloquées</p>
        </div>
        <div className="pan__body">
          <form action={addClosure} className="filters" style={{ marginBottom: 20 }}>
            <input type="date" name="day" required aria-label="Date à fermer" />
            <input name="reason" placeholder="Motif (vacances, férié…)" aria-label="Motif" style={{ minWidth: 240 }} />
            <button className="act" type="submit">Fermer cette journée</button>
          </form>

          {list.length === 0 ? (
            <p style={{ color: "var(--muted-2)", fontSize: 13 }}>Aucune fermeture enregistrée.</p>
          ) : (
            <table className="tbl">
              <tbody>
                {list.map((closure) => (
                  <tr key={closure.id}>
                    <td>
                      <b>{new Date(closure.day).toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</b>
                      <small>{closure.reason || "Sans motif"}</small>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <form action={removeClosure}>
                        <input type="hidden" name="id" value={closure.id} />
                        <button className="act" data-tone="danger" type="submit">Rouvrir</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
