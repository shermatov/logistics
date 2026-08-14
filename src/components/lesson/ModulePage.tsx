import type { ReactNode } from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";
import type { SkillLevel } from "../../data/moduleMeta";
import { useProgress } from "../../state/progress";
import { Pill } from "../ui/Misc";

const levelRu: Record<SkillLevel, string> = {
  Beginner: "Beginner — новичок",
  Operator: "Operator — оператор",
  Analyst: "Analyst — аналитик",
  Manager: "Manager — руководитель",
  Director: "Director — директор",
  Architect: "Architect — архитектор",
};

export function ModulePage({
  moduleId,
  number,
  title,
  intro,
  children,
  level,
}: {
  moduleId: string;
  number: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  level: SkillLevel;
}) {
  const { completedModules, markCompleted } = useProgress();
  const done = !!completedModules[moduleId];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
            style={{ color: "var(--text-secondary)", background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            MODULE {number}
          </span>
          <Pill tone="blue">{levelRu[level]}</Pill>
          {done && (
            <Pill tone="green">
              <CheckCircle2 size={12} strokeWidth={2.5} /> Пройдено
            </Pill>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {intro && (
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            {intro}
          </p>
        )}
      </div>

      {children}

      <div className="pt-2 pb-10">
        <button
          type="button"
          onClick={() => markCompleted(moduleId)}
          disabled={done}
          className="inline-flex items-center gap-2 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 disabled:cursor-default transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: done ? "var(--surface-2)" : "var(--gradient-fresh)",
            color: done ? "var(--text-secondary)" : "white",
            boxShadow: done ? "none" : "var(--shadow-sm)",
            border: done ? "1px solid var(--border)" : "none",
          }}
        >
          {done ? (
            <>
              <CheckCircle2 size={16} strokeWidth={2.5} />
              Модуль пройден
            </>
          ) : (
            <>
              <PartyPopper size={16} strokeWidth={2.2} />
              Отметить модуль как пройденный
            </>
          )}
        </button>
      </div>
    </div>
  );
}
