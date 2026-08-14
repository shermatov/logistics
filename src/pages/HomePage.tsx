import { Link } from "react-router-dom";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { SectionHeading, Pill, ProgressBar } from "../components/ui/Misc";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { moduleMeta, groups } from "../data/moduleMeta";
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
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--series-1)" }}>
          Logistics Management School
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Карта компетенций владельца направления «Логистика»
        </h1>
        <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Цель — не запомнить термины, а научиться управлять всей системой: от поставщика в Кыргызстане до клиента на
          Wildberries и обратно. Каждый модуль объясняет тему на 4 уровнях: What → How → Why → Decision.
        </p>
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
        return (
          <section key={group}>
            <SectionHeading eyebrow="Modules" title={group} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((m) => (
                <Link key={m.id} to={m.path}>
                  <Card className="h-full hover:opacity-90 transition-opacity">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
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
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {m.description}
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
