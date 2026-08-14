import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";
import { recommendFulfillmentModel } from "../lib/decisionEngine";

const quizQuestions = [
  {
    question: "SKU: продажи 35 шт/день, return rate 6%, объём 1.2 л, оборачиваемость 10 раз/год. Что предложит движок решений?",
    options: ["FBS — из-за низкой оборачиваемости", "FBW — все ключевые сигналы (скорость, возврат, объём, оборачиваемость) в пользу FBW", "Hybrid — сигналы противоречивы", "Недостаточно данных"],
    correctIndex: 1,
    explanation: "Высокая скорость продаж, низкий возврат, компактная упаковка и высокая оборачиваемость — все четыре сигнала указывают в одну сторону: FBW.",
  },
];

export function M14DecisionEngine() {
  const { recordQuiz } = useProgress();
  const [salesVelocity, setSalesVelocity] = useState(18);
  const [returnRatePct, setReturnRatePct] = useState(20);
  const [marginPct, setMarginPct] = useState(28);
  const [packageVolumeLiters, setPackageVolumeLiters] = useState(5);
  const [demandConcentrationPct, setDemandConcentrationPct] = useState(45);
  const [stockTurnover, setStockTurnover] = useState(6);
  const [warehouseCostShare, setWarehouseCostShare] = useState(9);

  const result = recommendFulfillmentModel({
    salesVelocity,
    returnRatePct,
    marginPct,
    packageVolumeLiters,
    demandConcentrationPct,
    stockTurnover,
    warehouseCostShare,
  });

  const recTone = result.recommendation === "FBW" ? "blue" : result.recommendation === "FBS" ? "orange" : "green";

  return (
    <ModulePage
      moduleId="m14"
      number="14"
      title="Logistics Decision Engine — движок решений FBS / FBW"
      level="Director"
      intro="Введите параметры конкретного SKU — движок прозрачно покажет, какие сигналы говорят за FBS, какие за FBW, и почему."
    >
      <section>
        <SectionHeading eyebrow="Decision" title="Should this SKU be FBS or FBW?" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Sales velocity, шт/день" value={salesVelocity} onChange={setSalesVelocity} />
              <NumberField label="Return rate, %" value={returnRatePct} onChange={setReturnRatePct} />
              <NumberField label="Маржа, %" value={marginPct} onChange={setMarginPct} />
              <NumberField label="Объём упаковки, л" value={packageVolumeLiters} onChange={setPackageVolumeLiters} step={0.5} />
              <NumberField label="Концентрация спроса в топ-регионе, %" value={demandConcentrationPct} onChange={setDemandConcentrationPct} />
              <NumberField label="Оборачиваемость, раз/год" value={stockTurnover} onChange={setStockTurnover} />
              <div className="col-span-2">
                <NumberField label="Складские расходы, % от цены" value={warehouseCostShare} onChange={setWarehouseCostShare} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                  Recommendation
                </div>
                <div className="text-2xl font-bold mb-1">
                  <Pill tone={recTone as "blue" | "orange" | "green"}>{result.recommendation}</Pill>
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {result.expectedEffect}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <KpiTile label="FBW score" value={String(result.fbwScore)} />
                <KpiTile label="FBS score" value={String(result.fbsScore)} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardTitle>Why — обоснование</CardTitle>
          <ul className="text-sm flex flex-col gap-2" style={{ color: "var(--text-secondary)" }}>
            {result.reasons.map((r, i) => (
              <li key={i}>— {r}</li>
            ))}
            {result.reasons.length === 0 && <li>Нет ярко выраженных сигналов ни в одну сторону.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Risks — на что обратить внимание</CardTitle>
          <ul className="text-sm flex flex-col gap-2" style={{ color: "var(--text-secondary)" }}>
            {result.risks.map((r, i) => (
              <li key={i}>— {r}</li>
            ))}
            {result.risks.length === 0 && <li>Существенных дополнительных рисков не выявлено.</li>}
          </ul>
        </Card>
      </section>

      <Card>
        <CardTitle>Как устроен движок</CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Это не «чёрный ящик»: каждый параметр даёт очки в пользу FBW или FBS по прозрачным правилам (см.{" "}
          <code>src/lib/decisionEngine.ts</code>). Итоговая рекомендация — FBS, FBW или Hybrid, если сигналы
          примерно уравновешены. Цель — не заменить решение руководителя, а сделать явными причины, из которых оно
          складывается.
        </p>
      </Card>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m14", score, total)} />
    </ModulePage>
  );
}
