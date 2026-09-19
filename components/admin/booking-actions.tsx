"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markDepositRefunded, saveAdminNotes, setBookingStatus } from "@/lib/admin/actions";
import { STATUS_LABELS } from "@/lib/format";
import type { BookingStatus, PaymentStatus } from "@/lib/types";

const FLOW: BookingStatus[] = ["pending", "confirmed", "in_progress", "completed"];

export function BookingActions({
  bookingId,
  status,
  depositStatus,
  adminNotes,
}: {
  bookingId: string;
  status: BookingStatus;
  depositStatus: PaymentStatus;
  adminNotes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(adminNotes);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<{ error?: string; ok?: boolean }>) =>
    startTransition(async () => {
      setError(null);
      const result = await task();
      if (result?.error) setError(result.error);
      else router.refresh();
    });

  return (
    <section className="pan">
      <div className="pan__head">
        <h2>Actions</h2>
        <p>Le client est informé par vos soins : cet espace ne déclenche aucun envoi automatique.</p>
      </div>
      <div className="pan__body">
        <div className="act-row" style={{ marginBottom: 18 }}>
          {FLOW.map((value) => (
            <button
              key={value}
              className="act"
              data-current={status === value}
              disabled={pending || status === value}
              onClick={() => run(() => setBookingStatus(bookingId, value))}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
          <button
            className="act"
            data-tone="danger"
            data-current={status === "cancelled"}
            disabled={pending || status === "cancelled"}
            onClick={() => run(() => setBookingStatus(bookingId, "cancelled"))}
          >
            Annuler
          </button>
          <button
            className="act"
            data-tone="danger"
            data-current={status === "no_show"}
            disabled={pending || status === "no_show"}
            onClick={() => run(() => setBookingStatus(bookingId, "no_show"))}
          >
            Absence
          </button>
          <button
            className="act"
            data-tone="danger"
            disabled={pending || depositStatus !== "paid"}
            onClick={() => run(() => markDepositRefunded(bookingId))}
          >
            Rembourser l’acompte
          </button>
        </div>

        <div className="field">
          <label htmlFor="admin-notes">Notes internes</label>
          <textarea
            id="admin-notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            placeholder="Matériel à prévoir, remarques après intervention, suivi client…"
          />
          <div className="act-row" style={{ marginTop: 10 }}>
            <button
              className="act"
              disabled={pending || notes === adminNotes}
              onClick={() =>
                startTransition(async () => {
                  const result = await saveAdminNotes(bookingId, notes);
                  if (result?.error) setError(result.error);
                  else {
                    setSaved(true);
                    router.refresh();
                  }
                })
              }
            >
              Enregistrer
            </button>
            {saved && <span style={{ fontSize: 12, color: "var(--ok)", alignSelf: "center" }}>Enregistré</span>}
          </div>
        </div>

        {error && <div className="alert">{error}</div>}
      </div>
    </section>
  );
}
