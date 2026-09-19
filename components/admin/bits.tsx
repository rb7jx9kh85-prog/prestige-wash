import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/format";
import type { BookingStatus, PaymentStatus } from "@/lib/types";

export function StatusChip({ status }: { status: BookingStatus }) {
  return <span className="chip" data-s={status}>{STATUS_LABELS[status] ?? status}</span>;
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  return <span className="chip" data-s={status}>{PAYMENT_LABELS[status] ?? status}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Kpi({
  label, value, hint, accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="kpi" data-accent={accent}>
      <span>{label}</span>
      <b>{value}</b>
      {hint && <small>{hint}</small>}
    </div>
  );
}
