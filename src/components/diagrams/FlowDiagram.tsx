import type { ReactNode } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";

export interface FlowStep {
  title: string;
  subtitle?: string;
  detail?: ReactNode;
  tone?: "blue" | "orange" | "aqua" | "violet" | "red";
}

const toneVar: Record<NonNullable<FlowStep["tone"]>, string> = {
  blue: "var(--series-1)",
  orange: "var(--series-2)",
  aqua: "var(--series-3)",
  violet: "var(--series-7)",
  red: "var(--series-8)",
};

function Connector({ direction = "right" }: { direction?: "right" | "down" }) {
  const Icon = direction === "right" ? ArrowRight : ArrowDown;
  return (
    <div
      className={direction === "right" ? "flex items-center px-1 shrink-0" : "flex justify-start pl-[15px] py-1"}
      aria-hidden
    >
      <span
        className="grid place-items-center w-6 h-6 rounded-full"
        style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        <Icon size={12} strokeWidth={2.5} />
      </span>
    </div>
  );
}

export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="scroll-x">
      <div className="flex items-stretch gap-2 min-w-max py-2">
        {steps.map((step, i) => {
          const color = step.tone ? toneVar[step.tone] : "var(--series-1)";
          return (
            <div key={i} className="flex items-stretch">
              <div
                className="group relative rounded-[var(--radius-sm)] border px-4 py-3 flex flex-col gap-1 w-44 shrink-0 overflow-hidden transition-transform duration-150 hover:-translate-y-0.5"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
              >
                <span className="absolute left-0 top-0 right-0 h-[3px]" style={{ background: color }} aria-hidden />
                <div
                  className="w-6 h-6 rounded-lg grid place-items-center mb-1 text-[10px] font-bold"
                  style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                >
                  {i + 1}
                </div>
                <div className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </div>
                {step.subtitle && (
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {step.subtitle}
                  </div>
                )}
                {step.detail && (
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {step.detail}
                  </div>
                )}
              </div>
              {i < steps.length - 1 && <Connector direction="right" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VerticalFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const color = step.tone ? toneVar[step.tone] : "var(--series-1)";
        return (
          <div key={i}>
            <div
              className="relative rounded-[var(--radius-sm)] border pl-5 pr-4 py-3 flex flex-col gap-1 overflow-hidden"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} aria-hidden />
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {step.title}
              </div>
              {step.subtitle && (
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {step.subtitle}
                </div>
              )}
              {step.detail && (
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {step.detail}
                </div>
              )}
            </div>
            {i < steps.length - 1 && <Connector direction="down" />}
          </div>
        );
      })}
    </div>
  );
}
