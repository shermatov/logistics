import type { ReactNode } from "react";
import clsx from "clsx";

const toneColor: Record<string, string> = {
  neutral: "var(--text-secondary)",
  blue: "var(--series-1)",
  orange: "var(--series-2)",
  aqua: "var(--series-3)",
  yellow: "var(--series-4)",
  green: "var(--series-3)",
  violet: "var(--series-7)",
  red: "var(--series-8)",
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "orange" | "aqua" | "yellow" | "green" | "violet" | "red";
}) {
  const color = toneColor[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={
        tone === "neutral"
          ? { color, background: "var(--surface-2)", border: "1px solid var(--border)" }
          : { color, background: `color-mix(in srgb, ${color} 14%, transparent)` }
      }
    >
      {children}
    </span>
  );
}

export function TermPair({ ru, en }: { ru: string; en: string }) {
  return (
    <span>
      <strong>{ru}</strong> {en && <span style={{ color: "var(--text-muted)" }}>— {en}</span>}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-4 h-[3px] rounded-full" style={{ background: "var(--gradient-brand)" }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-1)" }}>
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
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
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped * 100}%`, background: "var(--gradient-brand)" }}
      />
    </div>
  );
}

export function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gridline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tabular" style={{ color: "var(--text-primary)" }}>
        {Math.round(clamped * 100)}%
      </div>
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
  return (
    <span className="relative inline-flex w-2.5 h-2.5">
      {status === "critical" && (
        <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: colors[status] }} />
      )}
      <span className="relative inline-block w-2.5 h-2.5 rounded-full" style={{ background: colors[status] }} />
    </span>
  );
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={clsx("w-full rounded-xl border px-3 py-2 text-sm tabular outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_var(--focus-ring)]")}
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            ["--focus-ring" as string]: "color-mix(in srgb, var(--series-1) 25%, transparent)",
          }}
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <select
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-shadow duration-150"
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
