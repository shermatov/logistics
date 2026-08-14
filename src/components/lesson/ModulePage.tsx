import type { ReactNode } from "react";
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
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            MODULE {number}
          </span>
          <Pill tone="blue">{levelRu[level]}</Pill>
          {done && <Pill tone="green">✓ Пройдено</Pill>}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
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
          className="text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
          style={{ background: done ? "var(--surface-2)" : "var(--status-good)", color: done ? "var(--text-secondary)" : "white" }}
        >
          {done ? "Модуль пройден" : "Отметить модуль как пройденный"}
        </button>
      </div>
    </div>
  );
}

export function StubModulePage({ moduleId, number, title, level, description, outline }: {
  moduleId: string;
  number: string;
  title: string;
  level: SkillLevel;
  description: string;
  outline: string[];
}) {
  return (
    <ModulePage moduleId={moduleId} number={number} title={title} level={level} intro={description}>
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
          Структура модуля (черновик — раскрывается по мере прохождения курса)
        </div>
        <ul className="flex flex-col gap-2">
          {outline.map((item, i) => (
            <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-muted)" }}>{i + 1}.</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Скажите «раскрой модуль {number}», и мы наполним его по той же схеме: Concept → Visual → Example →
          Calculation → Case → Decision → Quiz → Challenge → Manager Question.
        </p>
      </div>
    </ModulePage>
  );
}
