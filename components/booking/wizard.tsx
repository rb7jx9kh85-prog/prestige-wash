"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import { fromISODate, hhmm, humanDuration, longDate, toISODate } from "@/lib/format";
import type { Service, ServiceOption, Slot, VehicleCategory } from "@/lib/types";

type Step = "service" | "formule" | "creneau" | "coordonnees" | "paiement" | "confirme";

const STEP_ORDER: Step[] = ["service", "formule", "creneau", "coordonnees", "paiement"];
const STEP_LABELS: Record<Step, string> = {
  service: "Prestation",
  formule: "Formule & options",
  creneau: "Date & heure",
  coordonnees: "Coordonnées",
  paiement: "Acompte",
  confirme: "Confirmé",
};

const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Messages renvoyés par les fonctions Postgres, traduits pour le client. */
const RPC_ERRORS: Record<string, string> = {
  CRENEAU_INDISPONIBLE: "Ce créneau vient d’être pris. Choisissez-en un autre, la liste a été actualisée.",
  ADRESSE_EMAIL_INVALIDE: "L’adresse e-mail saisie n’est pas valide.",
  NOM_REQUIS: "Merci d’indiquer votre prénom et votre nom.",
  TELEPHONE_REQUIS: "Merci d’indiquer un numéro de téléphone.",
  ADRESSE_REQUISE: "Merci d’indiquer l’adresse d’intervention.",
  PRESTATION_INTROUVABLE: "Cette prestation n’est plus disponible à la réservation.",
  FORMULE_INTROUVABLE: "Cette formule n’est plus disponible.",
  TROP_DE_DEMANDES: "Trois demandes ont déjà été enregistrées avec cette adresse aujourd’hui. Contactez-nous directement.",
  RESERVATION_INTROUVABLE: "Réservation introuvable. Reprenez la réservation depuis le début.",
};

function translateError(message: string) {
  const key = Object.keys(RPC_ERRORS).find((code) => message.includes(code));
  if (key) return RPC_ERRORS[key];
  if (/fetch|network|Failed to fetch|NetworkError/i.test(message)) {
    return "Connexion interrompue. Vérifiez votre réseau puis réessayez.";
  }
  return "Une erreur est survenue. Réessayez dans un instant.";
}

function cardBrand(number: string) {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  return "Carte";
}

function groupDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function BookingWizard({
  services,
  options,
  variants,
  initialService,
  connected,
}: {
  services: Service[];
  options: ServiceOption[];
  variants: VehicleCategory[];
  initialService: string | null;
  connected: boolean;
}) {
  const [step, setStep] = useState<Step>(initialService ? "formule" : "service");
  const [serviceSlug, setServiceSlug] = useState<string | null>(initialService);
  const [variantSlug, setVariantSlug] = useState<string | null>(null);
  const [chosenOptions, setChosenOptions] = useState<string[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [daysData, setDaysData] = useState<{ key: string; map: Record<string, number> } | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<{ key: string; list: Slot[] } | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address: "", postal_code: "", city: "", access_notes: "", customer_notes: "",
  });
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvc: "" });
  const [processing, setProcessing] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string; paymentReference: string } | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const service = useMemo(
    () => services.find((item) => item.slug === serviceSlug) ?? null,
    [services, serviceSlug],
  );
  const serviceVariants = useMemo(
    () => (service ? variants.filter((v) => v.applies_to === service.category) : []),
    [variants, service],
  );
  const serviceOptions = useMemo(
    () => (service ? options.filter((o) => o.service_id === service.id || o.service_id === null) : []),
    [options, service],
  );
  const variant = serviceVariants.find((v) => v.slug === variantSlug) ?? null;
  const picked = serviceOptions.filter((o) => chosenOptions.includes(o.slug));

  /** Change la prestation et repart de zéro sur tout ce qui en dépend. */
  function chooseService(slug: string) {
    setServiceSlug(slug);
    setVariantSlug(null);
    setChosenOptions([]);
    setSlotStart(null);
  }

  const total =
    (service?.price_from ?? 0) + (variant?.price_delta ?? 0) + picked.reduce((sum, o) => sum + o.price, 0);
  const duration =
    (service?.duration_min ?? 0) + (variant?.duration_delta ?? 0) + picked.reduce((sum, o) => sum + o.duration_min, 0);

  // Les données chargées portent la clé de la demande qui les a produites :
  // tant qu'elle ne correspond pas à la demande courante, c'est un chargement.
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const daysKey = `${monthKey}|${duration}`;
  const slotsKey = day ? `${day}|${duration}` : "";
  const daysFresh = daysData?.key === daysKey;
  const slotsFresh = slotsData?.key === slotsKey;
  const openDays = daysFresh ? daysData.map : {};
  const slots = slotsFresh ? slotsData.list : [];
  const loadingDays = step === "creneau" && !daysFresh;
  const loadingSlots = Boolean(day) && !slotsFresh;

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  /* ----------------------------------------------------- disponibilités */
  useEffect(() => {
    if (step !== "creneau" || !connected || duration <= 0) return;
    let cancelled = false;

    const today = new Date();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const from = first < today ? today : first;

    (async () => {
      try {
        const { data, error: rpcError } = await createClient().rpc("get_open_days", {
          p_from: toISODate(from),
          p_to: toISODate(last),
          p_duration: duration,
        });
        if (cancelled) return;
        if (rpcError) throw new Error(rpcError.message);

        const map: Record<string, number> = {};
        (data as { day: string; slots: number }[] | null)?.forEach((row) => {
          map[row.day] = row.slots;
        });
        setDaysData({ key: daysKey, map });
        setError(null);
      } catch (thrown) {
        // Un échec réseau ne doit pas laisser le calendrier en chargement.
        if (cancelled) return;
        setDaysData({ key: daysKey, map: {} });
        setError(translateError(thrown instanceof Error ? thrown.message : ""));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, month, duration, connected, daysKey]);

  useEffect(() => {
    if (!day || !connected || duration <= 0) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error: rpcError } = await createClient().rpc("get_available_slots", {
          p_day: day,
          p_duration: duration,
        });
        if (cancelled) return;
        if (rpcError) throw new Error(rpcError.message);
        setSlotsData({ key: slotsKey, list: (data as Slot[] | null) ?? [] });
        setError(null);
      } catch (thrown) {
        if (cancelled) return;
        setSlotsData({ key: slotsKey, list: [] });
        setError(translateError(thrown instanceof Error ? thrown.message : ""));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [day, duration, connected, slotsKey]);

  /* ------------------------------------------------------------- étapes */
  const canContinue = (() => {
    switch (step) {
      case "service": return Boolean(service);
      case "formule": return serviceVariants.length === 0 || Boolean(variant);
      case "creneau": return Boolean(day && slotStart);
      case "coordonnees":
        return Boolean(
          form.first_name.trim() && form.last_name.trim() &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
          form.phone.trim() && form.address.trim() && form.city.trim(),
        );
      default: return false;
    }
  })();

  const go = (direction: 1 | -1) => {
    setError(null);
    const index = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[index + direction];
    if (next) setStep(next);
  };

  /* ------------------------------------------------- paiement (démo) */
  async function pay() {
    if (!service || !day || !slotStart) return;
    setError(null);
    setProcessing(0);
    const supabase = createClient();

    try {
      // 1. Le créneau est réservé côté base, qui revérifie la disponibilité.
      const { data: created, error: createError } = await supabase.rpc("create_booking", {
        p_service_slug: service.slug,
        p_variant_slug: variantSlug ?? "",
        p_options: chosenOptions,
        p_day: day,
        p_start: slotStart,
        p_first_name: form.first_name,
        p_last_name: form.last_name,
        p_email: form.email,
        p_phone: form.phone,
        p_address: form.address,
        p_postal_code: form.postal_code,
        p_city: form.city,
        p_access_notes: form.access_notes,
        p_customer_notes: form.customer_notes,
      });
      if (createError) throw new Error(createError.message);

      const booking = created as { id: string; reference: string; client_token: string };

      // 2. Autorisation simulée : aucune donnée bancaire n'est transmise.
      setProcessing(1);
      await new Promise((resolve) => setTimeout(resolve, 1400));

      // 3. L'acompte est enregistré et la réservation passe en « confirmé ».
      setProcessing(2);
      const { data: paid, error: payError } = await supabase.rpc("register_demo_payment", {
        p_booking_id: booking.id,
        p_client_token: booking.client_token,
        p_cardholder: card.holder,
        p_card_brand: cardBrand(card.number),
        p_card_last4: card.number.replace(/\D/g, "").slice(-4),
      });
      if (payError) throw new Error(payError.message);

      await new Promise((resolve) => setTimeout(resolve, 600));
      const payment = paid as { reference: string; payment_reference: string };
      setResult({ reference: payment.reference, paymentReference: payment.payment_reference });
      setStep("confirme");
    } catch (thrown) {
      setError(translateError(thrown instanceof Error ? thrown.message : ""));
      setProcessing(-1);
      // Le créneau a peut-être changé : on force un rechargement.
      setSlotStart(null);
      setStep("creneau");
    }
  }

  const cardValid =
    card.holder.trim().length > 2 &&
    card.number.replace(/\D/g, "").length >= 15 &&
    /^\d{2}\s?\/\s?\d{2}$/.test(card.expiry.trim()) &&
    /^\d{3,4}$/.test(card.cvc.trim());

  if (!connected) {
    return (
      <div className="empty-note" style={{ padding: 40 }}>
        <p style={{ marginBottom: 16 }}>
          Le module de réservation a besoin de la base Supabase pour connaître les créneaux réellement libres.
        </p>
        <p style={{ marginBottom: 22, color: "var(--muted-2)", fontSize: 12.5 }}>
          Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>,
          puis appliquez les migrations du dossier <code>supabase/migrations</code>.
        </p>
        <a className="btn btn--primary" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
          Réserver par WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div ref={topRef}>
      {step !== "confirme" && (
        <div className="steps">
          {STEP_ORDER.map((item, index) => {
            const current = STEP_ORDER.indexOf(step);
            const state = index < current ? "done" : index === current ? "current" : "todo";
            return (
              <div className="steps__item" key={item} data-state={state}>
                <b>Étape {index + 1}</b>
                <span>{STEP_LABELS[item]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bk__layout">
        <div>
          {step === "service" && (
            <section className="panel">
              <h2 className="panel__title">Quelle prestation ?</h2>
              <p className="panel__hint">
                Chaque prestation a sa propre durée et ses propres options. La durée totale
                détermine ensuite les créneaux qui vous seront proposés.
              </p>
              <div className="pick-grid">
                {services.map((item) => (
                  <button
                    key={item.id}
                    className="pick"
                    data-selected={serviceSlug === item.slug}
                    onClick={() => chooseService(item.slug)}
                  >
                    <div className="pick__top">
                      <span className="pick__emoji" aria-hidden>{item.emoji}</span>
                      <span className="pick__price">dès {item.price_from}.-</span>
                    </div>
                    <b>{item.name}</b>
                    <p>{item.description}</p>
                    <small style={{ color: "var(--muted-2)", fontSize: 11.5 }}>
                      Durée de base : {humanDuration(item.duration_min)}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "formule" && service && (
            <section className="panel">
              <h2 className="panel__title">{service.name}</h2>
              <p className="panel__hint">{service.tagline}. Choisissez la formule, puis les options éventuelles.</p>

              {serviceVariants.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, letterSpacing: "0.2em", color: "var(--blue-bright)", marginBottom: 16 }}>
                    Formule
                  </h3>
                  <div className="pick-grid" style={{ marginBottom: 36 }}>
                    {serviceVariants.map((item) => (
                      <button
                        key={item.id}
                        className="pick"
                        data-selected={variantSlug === item.slug}
                        onClick={() => {
                          setVariantSlug(item.slug);
                          setSlotStart(null);
                        }}
                      >
                        <div className="pick__top">
                          <b>{item.label}</b>
                          <span className="pick__price">
                            {item.price_delta === 0 ? `${service.price_from}.-` : `+ ${item.price_delta}.-`}
                          </span>
                        </div>
                        <p>{item.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {serviceOptions.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, letterSpacing: "0.2em", color: "var(--blue-bright)", marginBottom: 16 }}>
                    Options
                  </h3>
                  <div className="pick-grid">
                    {serviceOptions.map((item) => {
                      const on = chosenOptions.includes(item.slug);
                      return (
                        <button
                          key={item.id}
                          className="pick"
                          data-selected={on}
                          onClick={() => {
                            setChosenOptions((list) =>
                              on ? list.filter((slug) => slug !== item.slug) : [...list, item.slug],
                            );
                            setSlotStart(null);
                          }}
                        >
                          <div className="pick__top">
                            <b>{item.name}</b>
                            <span className="pick__check" aria-hidden>
                              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                <path d="M1 4.5L4.2 8 11 1" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </span>
                          </div>
                          <p>{item.description}</p>
                          <span className="pick__price">
                            + {item.price}.- · + {humanDuration(item.duration_min)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {step === "creneau" && (
            <section className="panel">
              <h2 className="panel__title">Quand venons-nous ?</h2>
              <p className="panel__hint">
                Les créneaux affichés tiennent compte de nos horaires, des rendez-vous déjà
                pris et d’un délai de prévenance de deux heures. Durée réservée pour votre
                intervention : <b style={{ color: "var(--white)" }}>{humanDuration(duration)}</b>.
              </p>

              <div className="cal">
                <div>
                  <div className="cal__head">
                    <b>
                      {month.toLocaleDateString("fr-CH", { month: "long", year: "numeric" })}
                    </b>
                    <div className="cal__nav">
                      <button
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        disabled={month <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                        aria-label="Mois précédent"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        aria-label="Mois suivant"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="cal__dow" aria-hidden>
                    {DOW.map((label) => <span key={label}>{label}</span>)}
                  </div>

                  <div className="cal__grid">
                    {(() => {
                      const first = new Date(month.getFullYear(), month.getMonth(), 1);
                      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                      const offset = (first.getDay() + 6) % 7; // semaine commençant le lundi
                      const cells = [];
                      for (let i = 0; i < offset; i += 1) {
                        cells.push(<span key={`pad-${i}`} />);
                      }
                      for (let d = 1; d <= daysInMonth; d += 1) {
                        const iso = toISODate(new Date(month.getFullYear(), month.getMonth(), d));
                        const count = openDays[iso] ?? 0;
                        cells.push(
                          <button
                            key={iso}
                            className="cal__day"
                            data-open={count > 0}
                            data-selected={day === iso}
                            disabled={count === 0}
                            onClick={() => { setDay(iso); setSlotStart(null); }}
                            aria-label={`${longDate.format(fromISODate(iso))}, ${count} créneaux`}
                          >
                            {d}
                            {count > 0 && <i />}
                          </button>,
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  {loadingDays && (
                    <p style={{ marginTop: 14, fontSize: 12, color: "var(--muted-2)" }}>
                      Lecture des disponibilités…
                    </p>
                  )}
                </div>

                <div>
                  <div className="cal__head">
                    <b>{day ? longDate.format(fromISODate(day)) : "Choisissez une date"}</b>
                  </div>
                  {!day && <div className="empty-note">Sélectionnez d’abord un jour dans le calendrier.</div>}
                  {day && loadingSlots && <div className="empty-note">Recherche des créneaux libres…</div>}
                  {day && !loadingSlots && slots.length === 0 && (
                    <div className="empty-note">
                      Plus aucun créneau de {humanDuration(duration)} ce jour-là. Essayez une autre date.
                    </div>
                  )}
                  {day && !loadingSlots && slots.length > 0 && (
                    <div className="slots">
                      {slots.map((slot, index) => (
                        <button
                          key={slot.slot_start}
                          className="slot"
                          style={{ animationDelay: `${index * 22}ms` }}
                          data-selected={slotStart === slot.slot_start}
                          onClick={() => setSlotStart(slot.slot_start)}
                        >
                          {hhmm(slot.slot_start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === "coordonnees" && (
            <section className="panel">
              <h2 className="panel__title">Où intervenons-nous ?</h2>
              <p className="panel__hint">
                Ces informations servent à préparer l’intervention et à vous joindre. Elles ne
                sont visibles que par l’équipe Prestige Wash.
              </p>
              <div className="fields">
                <Field id="f-prenom" label="Prénom" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} required />
                <Field id="f-nom" label="Nom" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} required />
                <Field id="f-email" label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                <Field id="f-telephone" label="Téléphone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="079 000 00 00" required />
                <div className="full">
                  <Field id="f-adresse" label="Adresse d’intervention" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Rue et numéro" required />
                </div>
                <Field id="f-npa" label="NPA" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} placeholder="1950" />
                <Field id="f-localite" label="Localité" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Sion" required />
                <div className="full">
                  <Field id="f-acces" label="Accès" value={form.access_notes} onChange={(v) => setForm({ ...form, access_notes: v })} placeholder="Place de parc, étage, code d’entrée, prise électrique…" />
                </div>
                <div className="full field">
                  <label htmlFor="notes">Précisions (facultatif)</label>
                  <textarea
                    id="notes"
                    value={form.customer_notes}
                    onChange={(event) => setForm({ ...form, customer_notes: event.target.value })}
                    placeholder="Taches particulières, animaux, contraintes horaires…"
                  />
                </div>
              </div>
            </section>
          )}

          {step === "paiement" && service && (
            <section className="panel">
              <h2 className="panel__title">Acompte de {BRAND.depositAmount} CHF</h2>
              <p className="panel__hint">
                L’acompte bloque définitivement votre créneau et se déduit du montant final.
              </p>

              <div className="demo-banner">
                <span aria-hidden>⚠</span>
                <span>
                  <b>Mode démonstration.</b> Aucun paiement réel n’est effectué et aucune donnée
                  bancaire n’est transmise à un prestataire. Seuls la marque de la carte et ses
                  quatre derniers chiffres sont conservés, pour rendre la démonstration lisible.
                  Saisissez un numéro fictif.
                </span>
              </div>

              {processing >= 0 ? (
                <div className="processing">
                  {["Vérification du créneau", "Autorisation de la carte (simulée)", "Confirmation du rendez-vous"].map(
                    (label, index) => (
                      <div
                        className="proc-step"
                        key={label}
                        data-state={processing > index ? "done" : processing === index ? "active" : "todo"}
                      >
                        <span className="proc-dot">{processing > index ? "✓" : ""}</span>
                        {label}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="pay">
                  <div>
                    <div className="ccard">
                      <div className="ccard__top">
                        <span className="ccard__chip" aria-hidden />
                        <span className="ccard__brand">{cardBrand(card.number)}</span>
                      </div>
                      <div className="ccard__num">
                        {groupDigits(card.number) || "•••• •••• •••• ••••"}
                      </div>
                      <div className="ccard__meta">
                        <span>
                          <small>Titulaire</small>
                          {card.holder || "PRÉNOM NOM"}
                        </span>
                        <span>
                          <small>Expire</small>
                          {card.expiry || "MM/AA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="pay-amount">
                      <b>{BRAND.depositAmount}.-</b>
                      <span>CHF · acompte</span>
                    </div>
                    <div className="fields">
                      <div className="full">
                        <Field id="f-titulaire" label="Titulaire de la carte" value={card.holder} onChange={(v) => setCard({ ...card, holder: v.toUpperCase() })} placeholder="PRÉNOM NOM" />
                      </div>
                      <div className="full">
                        <Field
                          id="f-carte" label="Numéro (fictif)"
                          value={groupDigits(card.number)}
                          onChange={(v) => setCard({ ...card, number: v })}
                          placeholder="4242 4242 4242 4242"
                          inputMode="numeric"
                        />
                      </div>
                      <Field
                        id="f-expiration" label="Expiration"
                        value={card.expiry}
                        onChange={(v) => {
                          const digits = v.replace(/\D/g, "").slice(0, 4);
                          setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits });
                        }}
                        placeholder="12/28"
                        inputMode="numeric"
                      />
                      <Field
                        id="f-cvc" label="CVC"
                        value={card.cvc}
                        onChange={(v) => setCard({ ...card, cvc: v.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {step === "confirme" && result && service && day && slotStart && (
            <section className="panel done">
              <div className="done__mark">
                <svg width="42" height="32" viewBox="0 0 42 32" fill="none" aria-hidden>
                  <path d="M2 17l12 12L40 2" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
                </svg>
              </div>
              <h2 className="panel__title">Rendez-vous confirmé</h2>
              <p className="panel__hint" style={{ margin: "0 auto" }}>
                L’acompte de {BRAND.depositAmount} CHF a été enregistré et votre créneau est bloqué.
              </p>
              <div className="done__ref">{result.reference}</div>
              <p style={{ fontSize: 12, color: "var(--muted-2)" }}>
                Référence du paiement de démonstration : {result.paymentReference}
              </p>

              <div className="done__recap">
                <SummaryRow label="Prestation" value={service.name} />
                {variant && <SummaryRow label="Formule" value={variant.label} />}
                <SummaryRow label="Date" value={longDate.format(fromISODate(day))} />
                <SummaryRow label="Heure" value={`${hhmm(slotStart)} · ${humanDuration(duration)}`} />
                <SummaryRow label="Adresse" value={`${form.address}, ${form.postal_code} ${form.city}`} />
                <SummaryRow label="Montant estimé" value={`${total}.- CHF`} />
                <SummaryRow label="Acompte réglé" value={`${BRAND.depositAmount}.- CHF`} />
                <SummaryRow label="Solde sur place" value={`${total - BRAND.depositAmount}.- CHF`} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
                <Link className="btn btn--primary" href="/">Retour à l’accueil</Link>
                <a className="btn btn--ghost" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
                  Nous écrire
                </a>
              </div>
            </section>
          )}

          {error && <div className="alert" role="alert">{error}</div>}

          {step !== "confirme" && processing < 0 && (
            <div className="bk__actions">
              <button
                className="btn btn--ghost"
                onClick={() => go(-1)}
                disabled={STEP_ORDER.indexOf(step) === 0}
              >
                Retour
              </button>
              {step === "paiement" ? (
                <button className="btn btn--primary" onClick={pay} disabled={!cardValid}>
                  Payer {BRAND.depositAmount} CHF (démo)
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => go(1)} disabled={!canContinue}>
                  Continuer
                </button>
              )}
            </div>
          )}
        </div>

        {step !== "confirme" && (
          <aside className="summary">
            <div className="summary__inner">
              <h4>Votre réservation</h4>
              <div className="summary__row">
                <span>Prestation</span>
                <b>{service?.name ?? "—"}</b>
              </div>
              <div className="summary__row">
                <span>Formule</span>
                <b>{variant?.label ?? "—"}</b>
              </div>
              {picked.map((option) => (
                <div className="summary__row" key={option.slug}>
                  <span>{option.name}</span>
                  <b>+ {option.price}.-</b>
                </div>
              ))}
              <div className="summary__row">
                <span>Durée</span>
                <b>{duration > 0 ? humanDuration(duration) : "—"}</b>
              </div>
              <div className="summary__row">
                <span>Créneau</span>
                <b>{day && slotStart ? `${longDate.format(fromISODate(day))} · ${hhmm(slotStart)}` : "—"}</b>
              </div>

              <div className="summary__total">
                <span>Total estimé</span>
                <b>{total}.-</b>
              </div>
              <div className="summary__deposit">
                Acompte de {BRAND.depositAmount} CHF à la réservation, déduit du montant final.
                Solde de {Math.max(0, total - BRAND.depositAmount)}.- à régler sur place.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary__row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Field({
  id, label, value, onChange, type = "text", placeholder, required, inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span style={{ color: "var(--blue)" }}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
