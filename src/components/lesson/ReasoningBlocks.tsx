import { useState, type ReactNode } from "react";
import { Card, CardTitle } from "../ui/Card";
import { Pill } from "../ui/Misc";

export function ManagerQuestionBlock({ scenario, question, seniorAnswer }: { scenario: ReactNode; question: string; seniorAnswer: ReactNode }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Pill tone="orange">Manager Question</Pill>
      </div>
      <div className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {scenario}
      </div>
      <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        {question}
      </div>
      <textarea
        className="w-full rounded-lg border px-3 py-2 text-sm min-h-24 outline-none"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        placeholder="Опишите своё решение..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-sm font-medium rounded-lg px-4 py-2"
          style={{ background: "var(--series-2)", color: "white" }}
        >
          Показать решение senior-руководителя
        </button>
      </div>
      {revealed && (
        <div className="mt-4 rounded-lg border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}>
          {seniorAnswer}
        </div>
      )}
    </Card>
  );
}

export function ChallengeBlock({ task, hint }: { task: ReactNode; hint?: ReactNode }) {
  const [showHint, setShowHint] = useState(false);
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Pill tone="green">Challenge</Pill>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {task}
      </div>
      {hint && (
        <div className="mt-3">
          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs font-medium underline"
              style={{ color: "var(--series-1)" }}
            >
              Показать подсказку
            </button>
          ) : (
            <div className="text-xs mt-1 rounded-md px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
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
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="flex flex-col gap-3">
        {CASE_LABELS.map(({ key, label }) => (
          <div key={key}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
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
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Pill tone="blue">Why-chain</Pill>
      </div>
      <div className="flex flex-col">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="text-sm py-1" style={{ color: "var(--text-primary)" }}>
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className="pl-2 text-xs" style={{ color: "var(--text-muted)" }}>
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
