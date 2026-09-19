export const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

export const money = (value: number) => CHF.format(value).replace("CHF", "CHF ").replace(/\s+/g, " ").trim();

export const shortDate = new Intl.DateTimeFormat("fr-CH", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export const longDate = new Intl.DateTimeFormat("fr-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const dateTime = new Intl.DateTimeFormat("fr-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "14:30:00" → "14:30" */
export const hhmm = (time: string) => time.slice(0, 5);

/** Une date locale (pas UTC) au format "YYYY-MM-DD". */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date locale à midi, pour éviter les décalages de fuseau. */
export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function humanDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absence",
};

export const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  refunded: "Remboursé",
  failed: "Échoué",
};
