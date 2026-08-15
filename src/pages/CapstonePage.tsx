import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, RotateCcw, Zap, AlertOctagon, Info, CheckCircle2 } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { SectionHeading, Pill, ProgressBar } from "../components/ui/Misc";
import { KpiTile } from "../components/ui/KpiTile";
import { useDataStore } from "../state/dataStore";
import { fmtNum, fmtPct, fmtRub } from "../lib/formulas";
import {
  createInitialState,
  applyDecision,
  advanceUntilDecisionOrEnd,
  runAutopilot,
  summarize,
  HERO_SKUS,
  type SimState,
  type LogEntry,
} from "../lib/capstoneSim";

const LOG_ICON: Record<LogEntry["kind"], typeof Info> = {
  info: Info,
  event: Zap,
  decision: CheckCircle2,
  stockout: AlertOctagon,
};
const LOG_COLOR: Record<LogEntry["kind"], string> = {
  info: "var(--text-muted)",
  event: "var(--series-4)",
  decision: "var(--series-1)",
  stockout: "var(--status-critical)",
};

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function CapstonePage() {
  const { skus, warehouses, wbTariffs, cargoTariffs } = useDataStore();
  const tariffs = useMemo(() => ({ wb: wbTariffs, cargo: cargoTariffs }), [wbTariffs, cargoTariffs]);

  const [seed, setSeed] = useState(randomSeed);
  const [sim, setSim] = useState<SimState>(() => advanceUntilDecisionOrEnd(createInitialState(), seed, tariffs, warehouses));

  const results = useMemo(() => summarize(sim), [sim]);
  const baseline = useMemo(() => (sim.finished ? summarize(runAutopilot(seed, tariffs, warehouses)) : null), [sim.finished, seed, tariffs, warehouses]);

  function choose(optionId: string) {
    if (!sim.pendingDecision) return;
    const resolved = applyDecision(sim, sim.pendingDecision, optionId, tariffs, warehouses);
    setSim(advanceUntilDecisionOrEnd(resolved, seed, tariffs, warehouses));
  }

  function restart() {
    const newSeed = randomSeed();
    setSeed(newSeed);
    setSim(advanceUntilDecisionOrEnd(createInitialState(), newSeed, tariffs, warehouses));
  }

  const decision = sim.pendingDecision;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--series-4), var(--series-2))", boxShadow: "var(--shadow-sm)", color: "white" }}
          >
            <Trophy size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-4)" }}>
              Capstone
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upsell — управление логистикой 30 дней
            </h1>
          </div>
        </div>
        <p className="relative text-sm mt-3 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Полная линейка Upsell — {skus.length} SKU и {warehouses.length} складов, но день за днём вы управляете тремя
          показательными SKU с разным профилем риска. Каждое решение считается реальными формулами (reorder point,
          cargo cost, lead time) — это не заранее прописанный сценарий, а работающая модель склада.
        </p>
      </div>

      <section>
        <SectionHeading eyebrow="Hero SKUs" title="Чем вы управляете" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {HERO_SKUS.map((s) => {
            const rt = sim.skus[s.id];
            return (
              <Card key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                  <Pill tone={rt.fulfillment === "FBW" ? "blue" : "orange"}>{rt.fulfillment}</Pill>
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Return rate {fmtPct(s.returnRate)} · {fmtNum(s.baseVelocity)} ед/день база
                </div>
                <div className="text-xs mt-1 tabular" style={{ color: "var(--text-muted)" }}>
                  Сток в РФ сейчас: {fmtNum(rt.ruStock)} ед. ({rt.warehouseId})
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading eyebrow="Simulation" title={sim.finished ? "Итоги месяца" : `День ${sim.day} из 30`} />
        </div>
        {!sim.finished && (
          <div className="mb-4">
            <ProgressBar pct={sim.day / 30} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiTile label="Profit пока" value={fmtRub(results.profit)} status={results.profit > 0 ? "good" : "critical"} />
          <KpiTile label="Service level" value={fmtPct(results.serviceLevelPct)} status={results.serviceLevelPct > 0.9 ? "good" : results.serviceLevelPct > 0.75 ? "warning" : "critical"} />
          <KpiTile label="Логистика % от выручки" value={fmtPct(results.logisticsCostPctRevenue)} />
          <KpiTile label="Возвраты" value={fmtRub(results.returnCost)} />
        </div>

        {!sim.finished && decision ? (
          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--gradient-warm)" }} aria-hidden />
            <CardTitle>{decision.title}</CardTitle>
            <p className="text-sm mb-4" style={{ color: "var(--text-primary)" }}>
              {decision.description}
            </p>
            <div className="flex flex-col gap-2">
              {decision.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => choose(opt.id)}
                  className="text-left text-sm rounded-xl border px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--series-4)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", boxShadow: "var(--shadow-xs)" }}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{opt.note}</div>
                </button>
              ))}
            </div>
          </Card>
        ) : sim.finished ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <KpiTile label="Выручка" value={fmtRub(results.revenue)} />
              <KpiTile label="Оборачиваемость запасов" value={fmtNum(results.inventoryTurnover, 1) + "x"} />
              <KpiTile
                label="Capital efficiency"
                value={fmtPct(results.capitalEfficiency)}
                status={results.capitalEfficiency > 0 ? "good" : "critical"}
              />
            </div>

            {baseline && (
              <Card className="mb-4">
                <CardTitle>
                  Сравнение с эталонной стратегией <Pill tone="blue">не «математический оптимум»</Pill>
                </CardTitle>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Тот же месяц (тот же seed событий), но решения принимались по простому правилу: всегда самая быстрая
                  доставка, всегда чинить причину возврата сразу, всегда реагировать на всплеск спроса. Это разумный
                  ориентир, а не доказанно лучшее решение.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ComparisonTile label="Profit" mine={results.profit} base={baseline.profit} fmt={fmtRub} />
                  <ComparisonTile label="Service level" mine={results.serviceLevelPct} base={baseline.serviceLevelPct} fmt={fmtPct} />
                  <ComparisonTile label="Возвраты" mine={results.returnCost} base={baseline.returnCost} fmt={fmtRub} invert />
                  <ComparisonTile label="Capital efficiency" mine={results.capitalEfficiency} base={baseline.capitalEfficiency} fmt={fmtPct} />
                </div>
              </Card>
            )}

            <button
              onClick={restart}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 w-fit transition-transform duration-150 hover:-translate-y-0.5"
              style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
            >
              <RotateCcw size={14} strokeWidth={2.4} />
              Пройти заново (новый месяц)
            </button>
          </>
        ) : null}

        <Card padded={false}>
          <div className="p-5 pb-0">
            <CardTitle>Журнал месяца</CardTitle>
          </div>
          <div className="max-h-80 overflow-y-auto px-5 pb-5 flex flex-col gap-2">
            {[...sim.log].reverse().map((entry, i) => {
              const Icon = LOG_ICON[entry.kind];
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0" style={{ color: LOG_COLOR[entry.kind] }}>
                    <Icon size={13} strokeWidth={2.4} />
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    <span className="font-mono text-xs mr-1.5" style={{ color: "var(--text-muted)" }}>
                      д{entry.day}
                    </span>
                    {entry.text}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>
          О симуляции <Pill tone="green">v2</Pill>
        </CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Полноценная 30-дневная симуляция: спрос генерируется каждый день, решения о пополнении триггерятся реальной
          reorder-point формулой, стоимость доставки считается через тот же cargo-калькулятор, что и в Модуле 21.
          Упрощение: только 3 показательных SKU (не все {skus.length}) и склад в Кыргызстане считается неограниченным
          по поставкам — симуляция фокусируется на решениях в России, а не на производственной цепочке.
        </p>
        <Link to="/roadmap" className="inline-block text-sm underline mt-2" style={{ color: "var(--series-3)" }}>
          Полный roadmap проекта →
        </Link>
      </Card>
    </div>
  );
}

function ComparisonTile({ label, mine, base, fmt, invert }: { label: string; mine: number; base: number; fmt: (n: number) => string; invert?: boolean }) {
  const better = invert ? mine < base : mine > base;
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--surface-2)" }}>
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-sm font-bold tabular" style={{ color: "var(--text-primary)" }}>
        {fmt(mine)}
      </div>
      <div className="text-xs tabular" style={{ color: better ? "var(--status-good)" : "var(--status-critical)" }}>
        эталон: {fmt(base)}
      </div>
    </div>
  );
}
