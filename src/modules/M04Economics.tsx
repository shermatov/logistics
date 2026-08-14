import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { NumberField } from "../components/ui/Misc";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { WhyChain } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { calcUnitEconomics, logisticsCostPerSuccessfulSale, fmtRub, fmtPct } from "../lib/formulas";

const quizQuestions = [
  {
    question: "Logistics cost per successful sale отличается от logistics cost per order тем, что...",
    options: [
      "Это одно и то же",
      "Per successful sale учитывает, что часть заказов возвращается — расходы на них 'размазываются' на выкупленные заказы",
      "Per successful sale не учитывает комиссию маркетплейса",
      "Per successful sale считается только для FBW",
    ],
    correctIndex: 1,
    explanation: "Если 20% заказов возвращаются, их логистические расходы (доставка туда и обратно) должны быть покрыты оставшимися 80% успешных продаж — отсюда рост cost per successful sale относительно cost per order.",
  },
  {
    question: "Contribution margin — это...",
    options: [
      "Выручка минус все переменные расходы (себестоимость, логистика, комиссия и т.д.)",
      "Чистая прибыль компании после всех налогов",
      "Наценка на себестоимость товара",
      "Стоимость логистики в процентах от выручки",
    ],
    correctIndex: 0,
    explanation: "Contribution margin показывает, сколько остаётся с каждой продажи после переменных расходов — до вычета постоянных расходов бизнеса (аренда офиса, ФОТ управленцев и т.д.).",
  },
];

export function M04Economics() {
  const { recordQuiz } = useProgress();

  const [sellingPrice, setSellingPrice] = useState(1990);
  const [productCost, setProductCost] = useState(650);
  const [packagingCost, setPackagingCost] = useState(25);
  const [logisticsCost, setLogisticsCost] = useState(180);
  const [storageCost, setStorageCost] = useState(15);
  const [acceptanceCost, setAcceptanceCost] = useState(10);
  const [returnRatePct, setReturnRatePct] = useState(18);
  const [returnLogisticsCost, setReturnLogisticsCost] = useState(220);
  const [advertisingCost, setAdvertisingCost] = useState(60);
  const [fulfillmentCost, setFulfillmentCost] = useState(35);
  const [commissionRatePct, setCommissionRatePct] = useState(19);
  const [taxRatePct, setTaxRatePct] = useState(6);

  const returnRate = returnRatePct / 100;
  const returnCostAllocated = returnRate * returnLogisticsCost;

  const result = calcUnitEconomics({
    sellingPrice,
    productCost,
    packagingCost,
    logisticsCost,
    storageCost,
    acceptanceCost,
    returnCostAllocated,
    advertisingCost,
    fulfillmentCost,
    commissionRate: commissionRatePct / 100,
    taxRate: taxRatePct / 100,
  });

  const costPerSuccessfulSale = logisticsCostPerSuccessfulSale(logisticsCost, returnLogisticsCost, returnRate);

  const waterfall: [string, number][] = [
    ["Revenue (цена продажи)", sellingPrice],
    ["− Комиссия маркетплейса", -result.commissionAmount],
    ["− Логистика", -logisticsCost],
    ["− Хранение", -storageCost],
    ["− Приёмка", -acceptanceCost],
    ["− Возвраты (аллоцировано)", -returnCostAllocated],
    ["− Реклама", -advertisingCost],
    ["− Себестоимость товара", -productCost],
    ["− Упаковка", -packagingCost],
    ["− Fulfillment", -fulfillmentCost],
    ["− Налог", -result.taxAmount],
    ["= Contribution / Profit", result.contribution],
  ];

  return (
    <ModulePage
      moduleId="m04"
      number="04"
      title="Logistics Economics — экономика логистики"
      level="Analyst"
      intro="Каждое логистическое решение в конце концов должно ответить на один вопрос: что происходит с contribution margin? Здесь мы строим полную P&L-модель одной продажи и учимся читать её."
    >
      <section>
        <SectionHeading eyebrow="Concept" title="Модель P&L одной продажи" subtitle="Revenue минус все расходы равно Contribution / Profit." />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Цена продажи, ₽" value={sellingPrice} onChange={setSellingPrice} />
              <NumberField label="Себестоимость товара, ₽" value={productCost} onChange={setProductCost} />
              <NumberField label="Упаковка, ₽" value={packagingCost} onChange={setPackagingCost} />
              <NumberField label="Логистика (за заказ), ₽" value={logisticsCost} onChange={setLogisticsCost} />
              <NumberField label="Хранение, ₽" value={storageCost} onChange={setStorageCost} />
              <NumberField label="Приёмка, ₽" value={acceptanceCost} onChange={setAcceptanceCost} />
              <NumberField label="Реклама, ₽" value={advertisingCost} onChange={setAdvertisingCost} />
              <NumberField label="Fulfillment, ₽" value={fulfillmentCost} onChange={setFulfillmentCost} />
              <NumberField label="Return rate, %" value={returnRatePct} onChange={setReturnRatePct} />
              <NumberField label="Стоимость 1 возврата, ₽" value={returnLogisticsCost} onChange={setReturnLogisticsCost} />
              <NumberField label="Комиссия маркетплейса, %" value={commissionRatePct} onChange={setCommissionRatePct} />
              <NumberField label="Налог, % от выручки" value={taxRatePct} onChange={setTaxRatePct} />
            </div>
            <div>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {waterfall.map(([label, value], i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                    style={{
                      borderBottom: i < waterfall.length - 1 ? "1px solid var(--gridline)" : undefined,
                      background: i === waterfall.length - 1 ? "var(--surface-2)" : undefined,
                      fontWeight: i === waterfall.length - 1 ? 600 : 400,
                    }}
                  >
                    <span style={{ color: "var(--text-primary)" }}>{label}</span>
                    <span
                      className="tabular"
                      style={{ color: value < 0 ? "var(--text-secondary)" : value > 0 && i === waterfall.length - 1 ? "var(--success-text)" : "var(--text-primary)" }}
                    >
                      {fmtRub(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="Contribution margin"
          value={fmtPct(result.contributionMarginPct)}
          status={result.contributionMarginPct > 0.15 ? "good" : result.contributionMarginPct > 0.05 ? "warning" : "critical"}
        />
        <KpiTile label="Логистика, % от цены" value={fmtPct(result.logisticsCostSharePct)} />
        <KpiTile label="Logistics cost / successful sale" value={fmtRub(costPerSuccessfulSale)} sub={`при return rate ${returnRatePct}%`} />
        <KpiTile label="Прибыль с продажи" value={fmtRub(result.contribution)} status={result.contribution > 0 ? "good" : "critical"} />
      </section>

      <WhyChain
        steps={[
          "Return rate растёт",
          "Больше заказов требуют обратной логистики",
          "Расходы на возврат распределяются на меньшее число успешных продаж",
          "Logistics cost per successful sale растёт быстрее, чем logistics cost per order",
          "Contribution margin падает даже если цена и объём продаж не изменились",
        ]}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m04", score, total)} />
    </ModulePage>
  );
}
