import { useState, type ReactNode } from "react";
import { MessageCircleQuestion, Rocket, Lightbulb, ClipboardList, Waypoints, ArrowDown, Eye } from "lucide-react";
import { Card } from "../ui/Card";
import { Pill } from "../ui/Misc";

function BlockHeading({ icon: Icon, color, children }: { icon: typeof MessageCircleQuestion; color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
      >
        <Icon size={14} strokeWidth={2.4} />
      </span>
      {children}
    </div>
  );
}

export function ManagerQuestionBlock({ scenario, question, seniorAnswer }: { scenario: ReactNode; question: string; seniorAnswer: ReactNode }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--gradient-warm)" }} aria-hidden />
      <BlockHeading icon={MessageCircleQuestion} color="var(--series-2)">
        <Pill tone="orange">Manager Question</Pill>
      </BlockHeading>
      <div className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {scenario}
      </div>
      <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        {question}
      </div>
      <textarea
        className="w-full rounded-xl border px-3 py-2 text-sm min-h-24 outline-none transition-shadow"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        placeholder="Опишите своё решение..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-4 py-2 transition-transform duration-150 hover:-translate-y-0.5"
          style={{ background: "var(--gradient-warm)", color: "white", boxShadow: "var(--shadow-sm)" }}
        >
          <Eye size={14} strokeWidth={2.4} />
          Показать решение senior-руководителя
        </button>
      </div>
      {revealed && (
        <div
          className="pop-in mt-4 rounded-xl border p-4 text-sm leading-relaxed"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
        >
          {seniorAnswer}
        </div>
      )}
    </Card>
  );
}

export function ChallengeBlock({ task, hint }: { task: ReactNode; hint?: ReactNode }) {
  const [showHint, setShowHint] = useState(false);
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--gradient-fresh)" }} aria-hidden />
      <BlockHeading icon={Rocket} color="var(--series-3)">
        <Pill tone="green">Challenge</Pill>
      </BlockHeading>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {task}
      </div>
      {hint && (
        <div className="mt-3">
          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--series-1)" }}
            >
              <Lightbulb size={13} strokeWidth={2.4} />
              Показать подсказку
            </button>
          ) : (
            <div className="pop-in text-xs mt-1 rounded-lg px-3 py-2 border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {hint}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export interface DecisionCaseFields {
  situation: ReactNode;
  data: ReactNode;
  problem: ReactNode;
  options: ReactNode;
  economics: ReactNode;
  risk: ReactNode;
  decision: ReactNode;
  expectedResult: ReactNode;
}

const CASE_LABELS: { key: keyof DecisionCaseFields; label: string }[] = [
  { key: "situation", label: "Situation — Ситуация" },
  { key: "data", label: "Data — Данные" },
  { key: "problem", label: "Problem — Проблема" },
  { key: "options", label: "Options — Варианты" },
  { key: "economics", label: "Economics — Экономика" },
  { key: "risk", label: "Risk — Риски" },
  { key: "decision", label: "Decision — Решение" },
  { key: "expectedResult", label: "Expected Result — Ожидаемый результат" },
];

export function DecisionCaseBlock({ title, fields }: { title: string; fields: DecisionCaseFields }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--gradient-brand)" }} aria-hidden />
      <BlockHeading icon={ClipboardList} color="var(--series-7)">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </BlockHeading>
      <div className="flex flex-col gap-3">
        {CASE_LABELS.map(({ key, label }) => (
          <div key={key}>
            <div className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
              {label}
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {fields[key]}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WhyChain({ steps }: { steps: string[] }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-1)" }} aria-hidden />
      <BlockHeading icon={Waypoints} color="var(--series-1)">
        <Pill tone="blue">Why-chain</Pill>
      </BlockHeading>
      <div className="flex flex-col">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="text-sm py-1.5 px-3 rounded-lg" style={{ color: "var(--text-primary)", background: i % 2 === 0 ? "var(--surface-2)" : "transparent" }}>
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-start pl-3 py-0.5" aria-hidden style={{ color: "var(--series-1)" }}>
                <ArrowDown size={13} strokeWidth={2.4} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
