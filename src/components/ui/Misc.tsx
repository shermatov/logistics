import type { ReactNode } from "react";
import clsx from "clsx";

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "orange" | "green" | "red" }) {
  const toneColor: Record<string, string> = {
    neutral: "var(--text-secondary)",
    blue: "var(--series-1)",
    orange: "var(--series-2)",
    green: "var(--series-3)",
    red: "var(--series-8)",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ color: toneColor[tone], borderColor: "var(--border)" }}
    >
      {children}
    </span>
  );
}

export function TermPair({ ru, en }: { ru: string; en: string }) {
  return (
    <span>
      <strong>{ru}</strong> <span style={{ color: "var(--text-muted)" }}>— {en}</span>
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--series-1)" }}>
          {eyebrow}
        </div>
      )}
      <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--gridline)" }}>
      <div className="h-full rounded-full" style={{ width: `${clamped * 100}%`, background: "var(--series-1)" }} />
    </div>
  );
}

export function StatusDot({ status }: { status: "good" | "warning" | "serious" | "critical" }) {
  const colors = {
    good: "var(--status-good)",
    warning: "var(--status-warning)",
    serious: "var(--status-serious)",
    critical: "var(--status-critical)",
  };
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: colors[status] }} />;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={clsx("w-full rounded-lg border px-3 py-2 text-sm tabular outline-none")}
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        />
        {suffix && (
          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <select
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
