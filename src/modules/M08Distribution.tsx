import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { ManagerQuestionBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { allocationMismatchScore, fmtNum, fmtPct } from "../lib/formulas";
import { regions, nationalDemandShares } from "../data/sampleData";

type Strategy = "centralized" | "distributed";

const quizQuestions = [
  {
    question: "Почему централизованная модель (весь сток в одном складе) обычно ухудшает скорость доставки в удалённые регионы?",
    options: [
      "Потому что склад физически меньше",
      "Потому что расстояние и время в пути до удалённых регионов больше, а весь трафик идёт из одной точки",
      "Потому что в централизованной модели выше себестоимость товара",
      "Скорость доставки не зависит от расположения склада",
    ],
    correctIndex: 1,
    explanation: "Last mile (Модуль 01) становится длиннее для регионов, далёких от единственного склада — это напрямую увеличивает время и стоимость доставки именно туда.",
  },
  {
    question: "Главный недостаток полностью распределённой модели (сток размазан по многим складам пропорционально спросу)?",
    options: [
      "Она всегда дороже по логистике",
      "Она требует более точного прогноза спроса по регионам — ошибка прогноза создаёт locally overstock/understock",
      "Она невозможна технически",
      "Недостатков нет — распределённая модель всегда лучше",
    ],
    correctIndex: 1,
    explanation: "Распределение по регионам работает только если прогноз спроса по каждому региону достаточно точен. Хуже прогноз — выше риск локального избытка в одном регионе и нехватки в другом.",
  },
];

export function M08Distribution() {
  const { recordQuiz } = useProgress();
  const [totalUnits, setTotalUnits] = useState(10000);
  const [strategy, setStrategy] = useState<Strategy>("distributed");

  const data = useMemo(() => {
    return regions.map((r) => {
      const demandShare = nationalDemandShares[r];
      const stockShare = strategy === "centralized" ? (r === "Москва" ? 1 : 0) : demandShare;
      return {
        region: r,
        demandShare,
        stockShare,
        demandPct: Math.round(demandShare * 100),
        stockUnits: Math.round(stockShare * totalUnits),
      };
    });
  }, [strategy, totalUnits]);

  const demandShares: Record<string, number> = {};
  const stockShares: Record<string, number> = {};
  data.forEach((d) => {
    demandShares[d.region] = d.demandShare;
    stockShares[d.region] = d.stockShare;
  });
  const mismatch = allocationMismatchScore(demandShares, stockShares);

  return (
    <ModulePage
      moduleId="m08"
      number="08"
      title="Warehouse Distribution — распределение запасов по складам"
      level="Manager"
      intro="Сколько товара держать на каждом складе — это не вопрос интуиции. Это вопрос соответствия карты запасов карте спроса. Сценарий: 10 000 единиц и шесть регионов спроса."
    >
      <section>
        <SectionHeading eyebrow="Scenario" title="Централизованная vs распределённая модель" />
        <Card>
          <div className="flex flex-wrap items-end gap-4 mb-5">
            <div className="w-48">
              <NumberField label="Всего единиц товара" value={totalUnits} onChange={setTotalUnits} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStrategy("centralized")}
                className="text-sm font-medium rounded-lg px-4 py-2 border"
                style={{
                  background: strategy === "centralized" ? "var(--series-1)" : "transparent",
                  color: strategy === "centralized" ? "white" : "var(--text-primary)",
                  borderColor: strategy === "centralized" ? "var(--series-1)" : "var(--border)",
                }}
              >
                Centralized — всё в Москве
              </button>
              <button
                type="button"
                onClick={() => setStrategy("distributed")}
                className="text-sm font-medium rounded-lg px-4 py-2 border"
                style={{
                  background: strategy === "distributed" ? "var(--series-1)" : "transparent",
                  color: strategy === "distributed" ? "white" : "var(--text-primary)",
                  borderColor: strategy === "distributed" ? "var(--series-1)" : "var(--border)",
                }}
              >
                Distributed — по спросу
              </button>
            </div>
          </div>

          <div className="viz-root" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--gridline)" />
                <XAxis dataKey="region" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(value, name) => [`${(Number(value) * 100).toFixed(0)}%`, name]}
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--text-primary)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                <Bar dataKey="demandShare" name="Доля спроса" fill="var(--series-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockShare" name="Доля запаса на складе" fill="var(--series-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="Mismatch score"
          value={fmtPct(mismatch)}
          sub="0% = запас точно повторяет спрос"
          status={mismatch < 0.05 ? "good" : mismatch < 0.2 ? "warning" : "critical"}
        />
        <KpiTile label="Регионов с нулевым запасом" value={fmtNum(data.filter((d) => d.stockUnits === 0).length)} />
        <KpiTile label="Delivery speed impact" value={strategy === "centralized" ? "Медленнее в 5 из 6 регионов" : "Равномерно быстрее"} />
        <KpiTile label="Stockout risk" value={strategy === "centralized" ? "Высокий вне Москвы" : "Зависит от точности прогноза"} status={strategy === "centralized" ? "critical" : "warning"} />
      </section>

      <Card>
        <CardTitle>Как читать эту модель</CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          При <Pill tone="blue">Centralized</Pill> вся доля запаса уходит в один регион — 100% товара обслуживает 40%
          спроса быстро, а остальные 60% спроса едут через всю страну. При <Pill tone="orange">Distributed</Pill>
          доля запаса на каждом складе совпадает с долей спроса — mismatch score стремится к нулю, доставка в среднем
          быстрее, но появляется новый риск: точность прогноза по каждому региону теперь критична.
        </p>
      </Card>

      <ManagerQuestionBlock
        scenario={
          <>
            Спрос неожиданно сместился: доля Сибири выросла с 7% до 15% за квартал (например, из-за локальной
            рекламной кампании конкурента, ушедшего с рынка).
          </>
        }
        question="Вы используете распределённую модель. Что вы будете делать в первую очередь: перебрасывать сток из других складов или заказывать новую поставку под Сибирь? От чего зависит ответ?"
        seniorAnswer={
          <>
            Ответ зависит от <strong>lead time</strong> новой поставки против стоимости и времени внутреннего
            перемещения между складами. Если межскладской transfer быстрее и дешевле, чем ждать новую поставку —
            перебрасываем сток немедленно, одновременно запуская пополнение под новый уровень спроса. Если сдвиг
            спроса подтверждается 3+ недели (не разовый всплеск) — это сигнал пересчитать demand_share склада в
            Сибири на постоянной основе, а не разово перекинуть товар.
          </>
        }
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m08", score, total)} />
    </ModulePage>
  );
}
