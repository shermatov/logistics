import type { ReactNode } from "react";
import { HelpCircle, Settings2, Brain, Target, type LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";

interface Level {
  label: string;
  question: string;
  content: ReactNode;
  color: string;
  icon: LucideIcon;
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
    { label: "Level 1 — What", question: "Что это такое?", content: what, color: "var(--series-1)", icon: HelpCircle },
    { label: "Level 2 — How", question: "Как это работает?", content: how, color: "var(--series-3)", icon: Settings2 },
    { label: "Level 3 — Why", question: "Почему именно так?", content: why, color: "var(--series-4)", icon: Brain },
    { label: "Level 4 — Decision", question: "Как это использовать при принятии решений?", content: decision, color: "var(--series-2)", icon: Target },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {levels.map((l) => (
        <Card key={l.label} className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: l.color }} aria-hidden />
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-6 h-6 rounded-lg grid place-items-center shrink-0"
              style={{ background: `color-mix(in srgb, ${l.color} 16%, transparent)`, color: l.color }}
            >
              <l.icon size={13} strokeWidth={2.4} />
            </span>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: l.color }}>
              {l.label}
            </div>
          </div>
          <div className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            {l.question}
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {l.content}
          </div>
        </Card>
      ))}
    </div>
  );
}
