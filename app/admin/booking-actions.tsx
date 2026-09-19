"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Feedback = { tone: "ok" | "warn" | "error"; message: string };

export default function BookingActions({
  bookingNumber,
  hasEmail,
  status,
}: {
  bookingNumber: string;
  hasEmail: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "refuse" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function run(action: "accept" | "refuse") {
    setPending(action);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, booking_number: bookingNumber }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedback({ tone: "error", message: body?.error ?? "Action impossible." });
        return;
      }
      const label = action === "accept" ? "Rendez-vous accepté." : "Demande refusée.";
      setFeedback(
        body?.email?.sent
          ? { tone: "ok", message: `${label} E-mail envoyé au client.` }
          : { tone: "warn", message: `${label} E-mail non envoyé : ${body?.email?.reason ?? "raison inconnue"}.` },
      );
      router.refresh();
    } catch {
      setFeedback({ tone: "error", message: "Connexion impossible." });
    } finally {
      setPending(null);
    }
  }

  const decided = status === "confirmed" || status === "cancelled";

  return (
    <div className="booking-actions">
      <div>
        <button type="button" onClick={() => run("accept")} disabled={pending !== null || status === "confirmed"}>
          {pending === "accept" ? "…" : "Accepter"}
        </button>
        <button
          type="button"
          className="refuse"
          onClick={() => run("refuse")}
          disabled={pending !== null || status === "cancelled"}
        >
          {pending === "refuse" ? "…" : "Refuser"}
        </button>
      </div>
      {!hasEmail && <small className="booking-actions__warn">Aucun e-mail : prévenir par téléphone.</small>}
      {decided && !feedback && <small>Décision enregistrée. Vous pouvez encore la modifier.</small>}
      {feedback && <small className={`feedback feedback--${feedback.tone}`}>{feedback.message}</small>}
    </div>
  );
}
