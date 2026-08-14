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
  const accent = status ? statusVar[status] : "var(--series-1)";
  return (
    <div
      className="relative rounded-[var(--radius-md)] border p-4 flex flex-col gap-1 min-w-0 overflow-hidden transition-shadow duration-200"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: status ? accent : "transparent" }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-bold tabular truncate" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </div>
      )}
      {status && (
        <div
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold w-fit px-1.5 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          <span className={clsx("inline-block w-1.5 h-1.5 rounded-full")} style={{ background: accent }} />
          {statusLabel[status]}
        </div>
      )}
    </div>
  );
}
