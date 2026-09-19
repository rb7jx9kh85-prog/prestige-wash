import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { saveService } from "@/lib/admin/actions";
import { Empty } from "@/components/admin/bits";
import { humanDuration } from "@/lib/format";
import type { Service, ServiceOption, VehicleCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [services, options, variants] = await Promise.all([
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("service_options").select("*").order("sort_order"),
    supabase.from("vehicle_categories").select("*").order("sort_order"),
  ]);

  const list = (services.data as Service[] | null) ?? [];
  const allOptions = (options.data as ServiceOption[] | null) ?? [];
  const allVariants = (variants.data as VehicleCategory[] | null) ?? [];

  return (
    <>
      <header className="adm__head">
        <div>
          <h1>Prestations</h1>
          <p>Nom, tarif de départ et durée servent directement au calcul des créneaux et du prix.</p>
        </div>
      </header>

      {list.length === 0 && <Empty>Aucune prestation. Appliquez la migration de départ.</Empty>}

      {list.map((service) => {
        const serviceOptions = allOptions.filter((o) => o.service_id === service.id || o.service_id === null);
        const serviceVariants = allVariants.filter((v) => v.applies_to === service.category);

        return (
          <section className="pan" key={service.id}>
            <div className="pan__head">
              <h2>{service.emoji} {service.name}</h2>
              <p>
                {service.slug} · durée de base {humanDuration(service.duration_min)}
                {!service.is_active && " · masquée"}
                {service.is_active && !service.is_bookable && " · non réservable"}
              </p>
            </div>
            <div className="pan__body">
              <form action={saveService} className="fields">
                <input type="hidden" name="id" value={service.id} />
                <div className="field">
                  <label htmlFor={`n-${service.id}`}>Nom affiché</label>
                  <input id={`n-${service.id}`} name="name" defaultValue={service.name} />
                </div>
                <div className="field">
                  <label htmlFor={`p-${service.id}`}>Tarif de départ (CHF)</label>
                  <input id={`p-${service.id}`} name="price_from" type="number" min={0} step={5} defaultValue={service.price_from} />
                </div>
                <div className="field">
                  <label htmlFor={`d-${service.id}`}>Durée de base (minutes)</label>
                  <input id={`d-${service.id}`} name="duration_min" type="number" min={15} step={15} defaultValue={service.duration_min} />
                </div>
                <div className="field" style={{ alignContent: "end" }}>
                  <label>Visibilité</label>
                  <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--muted)" }}>
                    <label style={{ display: "flex", gap: 7, letterSpacing: 0, textTransform: "none", fontSize: 13 }}>
                      <input type="checkbox" name="is_active" defaultChecked={service.is_active} style={{ width: "auto" }} />
                      Affichée sur le site
                    </label>
                    <label style={{ display: "flex", gap: 7, letterSpacing: 0, textTransform: "none", fontSize: 13 }}>
                      <input type="checkbox" name="is_bookable" defaultChecked={service.is_bookable} style={{ width: "auto" }} />
                      Réservable
                    </label>
                  </div>
                </div>
                <div className="full field">
                  <label htmlFor={`desc-${service.id}`}>Description</label>
                  <textarea id={`desc-${service.id}`} name="description" defaultValue={service.description} />
                </div>
                <div className="full act-row">
                  <button className="act" type="submit">Enregistrer</button>
                </div>
              </form>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 26 }} className="dash-cols">
                <div>
                  <h3 style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--blue-bright)", marginBottom: 12 }}>
                    Formules
                  </h3>
                  <table className="tbl">
                    <tbody>
                      {serviceVariants.map((variant) => (
                        <tr key={variant.id}>
                          <td>
                            <b>{variant.label}</b>
                            <small>{variant.description}</small>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <b>{variant.price_delta === 0 ? "inclus" : `+ ${variant.price_delta}.-`}</b>
                            <small>{variant.duration_delta > 0 ? `+ ${variant.duration_delta} min` : "durée de base"}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--blue-bright)", marginBottom: 12 }}>
                    Options
                  </h3>
                  <table className="tbl">
                    <tbody>
                      {serviceOptions.map((option) => (
                        <tr key={option.id}>
                          <td>
                            <b>{option.name}</b>
                            <small>{option.description}</small>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <b>+ {option.price}.-</b>
                            <small>+ {option.duration_min} min</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
