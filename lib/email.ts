/**
 * Envoi d'e-mails transactionnels via Resend (API HTTP, sans dépendance).
 * Sans `RESEND_API_KEY`, l'envoi est simplement ignoré : le reste continue de fonctionner.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

const PHONE_DISPLAY = "078 804 96 23";
const ADDRESS = "Place de la Gare, 1020 Renens";

export type BookingEmailData = {
  booking_number: string;
  status: string;
  start_at: string;
  customer_name: string;
  email: string | null;
  service: string;
  vehicle: string | null;
  location: string | null;
};

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function sender() {
  return process.env.RESEND_FROM?.trim() || "Car Detailion <onboarding@resend.dev>";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-CH", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Zurich",
  });
}

function escape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, intro: string, rows: [string, string][], outro: string) {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;color:#8a8a86;font-size:11px;letter-spacing:.12em;text-transform:uppercase;width:42%">${escape(
          label,
        )}</td><td style="padding:10px 0;color:#16181a;font-size:15px">${escape(value)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f0e9;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0e9;padding:34px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3ded1">
        <tr><td style="background:#16181a;padding:26px 32px">
          <span style="color:#c9a45c;font-size:11px;letter-spacing:.22em">CAR DETAILION</span>
          <div style="color:#f3f0e9;font-size:12px;letter-spacing:.06em;margin-top:6px">L’excellence du détail automobile</div>
        </td></tr>
        <tr><td style="padding:34px 32px 8px">
          <h1 style="margin:0 0 16px;font-size:26px;color:#16181a;font-weight:600">${escape(title)}</h1>
          <p style="margin:0;color:#4c4d4f;font-size:15px;line-height:1.65">${intro}</p>
        </td></tr>
        <tr><td style="padding:14px 32px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9e4d8">${cells}</table>
        </td></tr>
        <tr><td style="padding:14px 32px 34px">
          <p style="margin:0;color:#4c4d4f;font-size:15px;line-height:1.65">${outro}</p>
        </td></tr>
        <tr><td style="background:#16181a;padding:22px 32px;color:#8a8a86;font-size:12px;line-height:1.7">
          ${escape(ADDRESS)}<br />${escape(PHONE_DISPLAY)}
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  if (!isConfigured()) return { sent: false, reason: "RESEND_API_KEY absente" };
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: sender(), to: [to], subject, html }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { sent: false, reason: `Resend a refusé l’envoi (${response.status}) ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: "Resend injoignable." };
  }
}

export async function sendBookingAccepted(booking: BookingEmailData) {
  if (!booking.email) return { sent: false, reason: "Le client n’a pas laissé d’e-mail." };
  const rows: [string, string][] = [
    ["Référence", booking.booking_number],
    ["Prestation", booking.service],
    ["Date et heure", formatDate(booking.start_at)],
  ];
  if (booking.vehicle) rows.push(["Véhicule", booking.vehicle]);
  return send(
    booking.email,
    `Votre rendez-vous est confirmé — ${booking.booking_number}`,
    layout(
      `Merci ${escape(booking.customer_name.split(" ")[0] || "")}, c’est confirmé.`,
      "Nous avons le plaisir de confirmer votre rendez-vous chez Car Detailion.",
      rows,
      `Rendez-vous ${escape(ADDRESS)}. En cas d’empêchement, prévenez-nous au ${escape(
        PHONE_DISPLAY,
      )} afin que nous puissions libérer le créneau.`,
    ),
  );
}

export async function sendBookingRefused(booking: BookingEmailData) {
  if (!booking.email) return { sent: false, reason: "Le client n’a pas laissé d’e-mail." };
  const rows: [string, string][] = [
    ["Référence", booking.booking_number],
    ["Prestation", booking.service],
    ["Créneau demandé", formatDate(booking.start_at)],
  ];
  return send(
    booking.email,
    `Votre demande de rendez-vous — ${booking.booking_number}`,
    layout(
      `Bonjour ${escape(booking.customer_name.split(" ")[0] || "")},`,
      "Nous vous remercions pour votre demande, que nous ne pouvons malheureusement pas honorer sur ce créneau.",
      rows,
      `Nous serions ravis de vous accueillir à un autre moment : appelez-nous ou écrivez-nous au ${escape(
        PHONE_DISPLAY,
      )} et nous trouverons ensemble une date qui vous convient.`,
    ),
  );
}
