import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { NumberField, Pill } from "../components/ui/Misc";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { WhyChain } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { volumeLiters, volumeBracket, estimatedLogisticsCostPerUnit, logisticsCostShareOfPrice, fmtRub, fmtPct, fmtNum } from "../lib/formulas";
import { useDataStore } from "../state/dataStore";

const quizQuestions = [
  {
    question: "Что происходит со стоимостью логистики за единицу, если объём упаковки переходит в следующий тарифный диапазон (bracket)?",
    options: [
      "Ничего, тариф считается только по весу",
      "Стоимость растёт скачкообразно, а не пропорционально — коэффициент диапазона применяется целиком",
      "Стоимость снижается, так как крупные упаковки дешевле",
      "Тариф не зависит от объёма",
    ],
    correctIndex: 1,
    explanation: "Тарифные сетки построены на объёмных диапазонах (brackets). Переход через границу диапазона может увеличить коэффициент сразу на десятки процентов, даже если физический объём вырос всего на пару процентов.",
  },
  {
    question: "Почему в проекте нельзя было просто «зашить» текущие тарифы Wildberries как константы?",
    options: [
      "Потому что так проще программировать",
      "Потому что тарифы WB регулярно меняются, и захардкоженные значения быстро устареют и введут в заблуждение",
      "Потому что тарифы одинаковы для всех категорий и не имеют смысла",
      "Потому что Wildberries не публикует тарифы",
    ],
    correctIndex: 1,
    explanation: "Именно поэтому тарифы вынесены в отдельный конфигурационный слой (data/tariffs.ts) с датой актуальности и пометкой 'assumption' — их обновляют, не трогая формулы.",
  },
];

export function M05Packaging() {
  const { recordQuiz } = useProgress();
  const { wbTariffs } = useDataStore();

  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(22);
  const [height, setHeight] = useState(8);
  const [weight, setWeight] = useState(0.6);
  const [quantity, setQuantity] = useState(500);
  const [price, setPrice] = useState(1990);
  const [coefficient, setCoefficient] = useState(1.0);

  const liters = volumeLiters(length, width, height);
  const bracket = volumeBracket(liters, wbTariffs);
  const costPerUnit = estimatedLogisticsCostPerUnit(liters, coefficient, wbTariffs);
  const share = logisticsCostShareOfPrice(costPerUnit, price);
  const totalForBatch = costPerUnit * quantity;

  return (
    <ModulePage
      moduleId="m05"
      number="05"
      title="Packaging Economics — экономика упаковки"
      level="Analyst"
      intro="Объём упаковки — это не техническая деталь, это прямой вход в тариф. Каждый лишний сантиметр коробки можно перевести в рубли, съеденные у маржи."
    >
      <section>
        <SectionHeading eyebrow="Concept" title="Цепочка: Packaging → Volume → Tariff → Logistics Cost → Margin" />
        <WhyChain
          steps={[
            "Увеличивается размер упаковки (лишний картон, пустое место в коробке)",
            "Растёт объём в литрах",
            "Объём переходит в более высокий тарифный диапазон (bracket)",
            "Логистический коэффициент скачкообразно увеличивается",
            "Растёт стоимость логистики за единицу товара",
            "Маржа с продажи падает — даже если сам товар не изменился",
          ]}
        />
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Калькулятор упаковки" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Длина, см" value={length} onChange={setLength} />
              <NumberField label="Ширина, см" value={width} onChange={setWidth} />
              <NumberField label="Высота, см" value={height} onChange={setHeight} />
              <NumberField label="Вес, кг" value={weight} onChange={setWeight} step={0.05} />
              <NumberField label="Количество в партии, шт" value={quantity} onChange={setQuantity} />
              <NumberField label="Цена продажи, ₽" value={price} onChange={setPrice} />
              <NumberField label="Коэффициент склада (WH multiplier)" value={coefficient} onChange={setCoefficient} step={0.05} />
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile label="Объём" value={`${fmtNum(liters, 2)} л`} />
              <KpiTile label="Тарифный диапазон" value={bracket.label} sub={`коэффициент ×${bracket.coefficient}`} />
              <KpiTile
                label="Логистика / единица"
                value={fmtRub(costPerUnit)}
                status={share < 0.08 ? "good" : share < 0.15 ? "warning" : "critical"}
              />
              <KpiTile label="Доля от цены продажи" value={fmtPct(share)} />
              <KpiTile label="Логистика на партию" value={fmtRub(totalForBatch)} />
              <KpiTile label="Партия" value={`${fmtNum(quantity)} шт`} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <CardTitle>Tariff Configuration <Pill tone="orange">не текущие реальные тарифы WB</Pill></CardTitle>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Значения ниже — учебная модель (data/tariffs.ts), актуальная на {wbTariffs.as_of_date}. {wbTariffs.source_note}
          </p>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    Диапазон
                  </th>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    Коэффициент
                  </th>
                </tr>
              </thead>
              <tbody>
                {wbTariffs.volume_brackets.map((b) => (
                  <tr key={b.label} style={{ borderBottom: "1px solid var(--gridline)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                      {b.label}
                    </td>
                    <td className="px-3 py-2 tabular" style={{ color: "var(--text-secondary)" }}>
                      ×{b.coefficient}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m05", score, total)} />
    </ModulePage>
  );
}
