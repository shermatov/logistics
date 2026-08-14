import type { ReactNode } from "react";
import clsx from "clsx";

type Status = "good" | "warning" | "serious" | "critical" | undefined;

const statusVar: Record<Exclude<Status, undefined>, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
};

const statusLabel: Record<Exclude<Status, undefined>, string> = {
  good: "В норме",
  warning: "Внимание",
  serious: "Риск",
  critical: "Критично",
};

export function KpiTile({
  label,
  value,
  sub,
  status,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  status?: Status;
  icon?: ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1 min-w-0"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide truncate" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tabular truncate" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </div>
      )}
      {status && (
        <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium w-fit">
          <span
            className={clsx("inline-block w-2 h-2 rounded-full")}
            style={{ background: statusVar[status] }}
          />
          <span style={{ color: "var(--text-secondary)" }}>{statusLabel[status]}</span>
        </div>
      )}
    </div>
  );
}
