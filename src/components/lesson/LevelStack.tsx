import type { ReactNode } from "react";
import { Card } from "../ui/Card";

interface Level {
  label: string;
  question: string;
  content: ReactNode;
  color: string;
}

export function LevelStack({
  what,
  how,
  why,
  decision,
}: {
  what: ReactNode;
  how: ReactNode;
  why: ReactNode;
  decision: ReactNode;
}) {
  const levels: Level[] = [
    { label: "Level 1 — What", question: "Что это такое?", content: what, color: "var(--series-1)" },
    { label: "Level 2 — How", question: "Как это работает?", content: how, color: "var(--series-3)" },
    { label: "Level 3 — Why", question: "Почему именно так?", content: why, color: "var(--series-4)" },
    { label: "Level 4 — Decision", question: "Как это использовать при принятии решений?", content: decision, color: "var(--series-2)" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {levels.map((l) => (
        <Card key={l.label} className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{ background: l.color }}
            aria-hidden
          />
          <div className="pl-2">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: l.color }}>
              {l.label}
            </div>
            <div className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              {l.question}
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {l.content}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
