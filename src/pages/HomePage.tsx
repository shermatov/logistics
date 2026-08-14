import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { SectionHeading, Pill, ProgressBar } from "../components/ui/Misc";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { moduleMeta, groups } from "../data/moduleMeta";
import { groupStyle } from "../data/groupIcons";
import { useProgress } from "../state/progress";
import { fmtPct } from "../lib/formulas";

const competencyBranches: { name: string; children: string[] }[] = [
  { name: "Transportation", children: ["Cross-border cargo (KG→RU)", "FTL / LTL / 3PL", "Middle mile"] },
  { name: "Warehousing", children: ["Receiving/Putaway", "Picking/Packing", "Own warehouse economics"] },
  { name: "Inventory", children: ["Safety stock", "Reorder point", "Turnover"] },
  { name: "Fulfillment", children: ["FBS", "FBW", "Hybrid"] },
  { name: "Distribution", children: ["Localization", "Warehouse allocation"] },
  { name: "Returns", children: ["Reverse logistics", "Return rate impact"] },
  { name: "Analytics", children: ["Scenarios", "Alerts"] },
  { name: "Economics", children: ["Unit economics", "Fully landed cost"] },
  { name: "Strategy", children: ["Trade-offs", "Crisis management"] },
];

export function HomePage() {
  const { completionPct, averageQuizPct, completedModules } = useProgress();
  const pct = completionPct(moduleMeta.length);
  const quizPct = averageQuizPct();

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-8 sm:px-10 sm:py-10"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 blur-2xl"
          style={{ background: "var(--gradient-warm)" }}
          aria-hidden
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-3 px-2.5 py-1 rounded-full" style={{ color: "var(--series-1)", background: "color-mix(in srgb, var(--series-1) 12%, transparent)" }}>
            <Sparkles size={12} strokeWidth={2.5} />
            Logistics Management School
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-2xl" style={{ color: "var(--text-primary)" }}>
            Карта компетенций владельца направления «Логистика»
          </h1>
          <p className="text-sm mt-3 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Цель — не запомнить термины, а научиться управлять всей системой: от поставщика в Кыргызстане до клиента
            на Wildberries и обратно. Каждый модуль объясняет тему на 4 уровнях: What → How → Why → Decision.
          </p>
          <Link to="/roadmap" className="inline-block text-xs font-semibold underline mt-3" style={{ color: "var(--series-1)" }}>
            Все данные в проекте учебные — откуда они и что дальше →
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Прогресс курса" value={fmtPct(pct)} status={pct > 0.6 ? "good" : pct > 0.2 ? "warning" : undefined} />
        <KpiTile label="Пройдено модулей" value={`${Object.keys(completedModules).length} / ${moduleMeta.length}`} />
        <KpiTile label="Средний результат тестов" value={quizPct > 0 ? fmtPct(quizPct) : "—"} />
        <KpiTile label="Готовых модулей" value={`${moduleMeta.filter((m) => m.built).length} / ${moduleMeta.length}`} sub="полностью раскрыты" />
      </section>

      <section>
        <SectionHeading eyebrow="Knowledge map" title="Как связаны компетенции" subtitle="Прогноз спроса определяет всё, что происходит дальше по цепочке." />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Demand Forecasting", subtitle: "Прогноз спроса", tone: "blue" },
              { title: "Inventory Planning", subtitle: "Планирование запасов", tone: "blue" },
              { title: "Warehouse Allocation", subtitle: "Распределение по складам", tone: "aqua" },
              { title: "Logistics Cost", subtitle: "Стоимость логистики", tone: "orange" },
              { title: "Service Level", subtitle: "Уровень сервиса", tone: "orange" },
              { title: "Profit", subtitle: "Прибыль", tone: "red" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Competency tree" title="Дерево компетенций LOGISTICS" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {competencyBranches.map((b) => (
            <Card key={b.name}>
              <CardTitle>{b.name}</CardTitle>
              <ul className="text-sm flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>
                {b.children.map((c) => (
                  <li key={c}>— {c}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {groups.map((group) => {
        const items = moduleMeta.filter((m) => m.group === group);
        if (items.length === 0) return null;
        const style = groupStyle[group];
        return (
          <section key={group}>
            <div className="flex items-center gap-2 mb-4">
              {style && (
                <span
                  className="w-8 h-8 rounded-xl grid place-items-center shrink-0"
                  style={{ color: style.color, background: `color-mix(in srgb, ${style.color} 14%, transparent)` }}
                >
                  <style.icon size={16} strokeWidth={2.2} />
                </span>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: style?.color ?? "var(--series-1)" }}>
                  Modules
                </div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{group}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((m) => (
                <Link key={m.id} to={m.path} className="block h-full">
                  <Card interactive className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
                        MODULE {m.number}
                      </span>
                      <div className="flex gap-1">
                        {!m.built && <Pill tone="orange">Черновик</Pill>}
                        {completedModules[m.id] && <Pill tone="green">✓</Pill>}
                      </div>
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                      {m.shortTitle}
                    </div>
                    <div className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                      {m.description}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold mt-3" style={{ color: style?.color ?? "var(--series-1)" }}>
                      Открыть модуль
                      <ArrowRight size={12} strokeWidth={2.5} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <Card>
        <CardTitle>Прогресс курса</CardTitle>
        <ProgressBar pct={pct} />
      </Card>
    </div>
  );
}
