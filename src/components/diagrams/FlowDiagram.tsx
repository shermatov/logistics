import type { ReactNode } from "react";

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

export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="scroll-x">
      <div className="flex items-stretch gap-2 min-w-max py-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-stretch">
            <div
              className="rounded-lg border px-4 py-3 flex flex-col gap-1 w-44 shrink-0"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div
                className="w-2 h-2 rounded-full mb-1"
                style={{ background: step.tone ? toneVar[step.tone] : "var(--series-1)" }}
              />
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
            {i < steps.length - 1 && (
              <div className="flex items-center px-1 shrink-0" aria-hidden style={{ color: "var(--text-muted)" }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerticalFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => (
        <div key={i}>
          <div
            className="rounded-lg border px-4 py-3 flex flex-col gap-1"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
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
          {i < steps.length - 1 && (
            <div className="flex justify-start pl-6 py-0.5" aria-hidden style={{ color: "var(--text-muted)" }}>
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
