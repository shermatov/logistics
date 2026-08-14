import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField, TermPair } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { WhyChain } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { returnRate, returnCostImpact, logisticsCostPerSuccessfulSale, fmtRub, fmtPct, fmtNum } from "../lib/formulas";
import { returnReasonBreakdown } from "../data/sampleData";

const fashionReasons: [string, string][] = [
  ["Size mismatch", "Не подошёл размер — самая частая причина в одежде и обуви."],
  ["Fit", "Подошёл размер, но не подошёл крой/посадка — часто у брендов без стандартизированной сетки."],
  ["Quality", "Брак, дефект, несоответствие материалу из описания."],
  ["Expectation mismatch", "Фото/описание создали ожидание, которое товар не оправдал."],
];

const quizQuestions = [
  {
    question: "Заказов 1000, возвратов 220, стоимость 1 возврата 240 ₽. Какова дополнительная логистическая нагрузка от возвратов?",
    options: ["52 800 ₽", "240 000 ₽", "220 000 ₽", "24 000 ₽"],
    correctIndex: 0,
    explanation: "Return cost impact = Returns × Cost per Return = 220 × 240 = 52 800 ₽.",
  },
  {
    question: "Почему для fashion-категорий return rate обычно системно выше, чем для товаров для дома?",
    options: [
      "Потому что одежда дешевле",
      "Потому что размер и посадку нельзя проверить до примерки, в отличие от многих непримеряемых товаров",
      "Потому что одежда всегда доставляется дольше",
      "Return rate не зависит от категории",
    ],
    correctIndex: 1,
    explanation: "Размер/посадка — это атрибут, который клиент не может проверить онлайн с уверенностью, отсюда системно более высокий return rate у fashion.",
  },
];

export function M10Returns() {
  const { recordQuiz } = useProgress();
  const [orders, setOrders] = useState(1000);
  const [returns, setReturns] = useState(220);
  const [costPerReturn, setCostPerReturn] = useState(240);
  const [logisticsCostPerOrder, setLogisticsCostPerOrder] = useState(180);
  const [contributionPerSale, setContributionPerSale] = useState(420);

  const rRate = returnRate(returns, orders);
  const impact = returnCostImpact(returns, costPerReturn);
  const costPerSuccessful = logisticsCostPerSuccessfulSale(logisticsCostPerOrder, costPerReturn, rRate);
  const successfulSales = orders - returns;
  const totalContributionLoss = impact;
  const contributionAfterReturns = successfulSales * contributionPerSale - totalContributionLoss;

  return (
    <ModulePage
      moduleId="m10"
      number="10"
      title="Returns & Reverse Logistics — возвраты и обратная логистика"
      level="Analyst"
      intro="Возврат — это не просто 'заказ не состоялся'. Это заказ, у которого расходы на доставку уже понесены, плюс появляются новые расходы на обратный путь."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Два исхода одного заказа" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Order", subtitle: "Заказ оформлен", tone: "blue" },
              { title: "Delivery", subtitle: "Доставлен клиенту", tone: "blue" },
              { title: "Purchase", subtitle: "Выкуплен", tone: "aqua" },
            ]}
          />
          <div className="h-3" />
          <FlowDiagram
            steps={[
              { title: "Order", subtitle: "Заказ оформлен", tone: "blue" },
              { title: "Delivery", subtitle: "Доставлен клиенту", tone: "blue" },
              { title: "Return", subtitle: "Возврат", tone: "red" },
              { title: "Reverse logistics", subtitle: "Обратная логистика", tone: "red" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="Причины возврата в fashion" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fashionReasons.map(([en, desc]) => (
            <Card key={en}>
              <TermPair ru={en} en="" />
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-3">
          <CardTitle>Структура причин возврата (пример компании)</CardTitle>
          <div className="flex flex-col gap-1.5">
            {returnReasonBreakdown
              .slice()
              .sort((a, b) => b.share - a.share)
              .map((r) => (
                <div key={r.reason} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0" style={{ color: "var(--text-secondary)" }}>{r.reason}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gridline)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.share * 100}%`, background: "var(--series-1)" }} />
                  </div>
                  <span className="tabular w-10 text-right" style={{ color: "var(--text-primary)" }}>{fmtPct(r.share, 0)}</span>
                </div>
              ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Калькулятор: Return Rate → доп. расходы → влияние на прибыль" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Заказов" value={orders} onChange={setOrders} />
              <NumberField label="Возвратов" value={returns} onChange={setReturns} />
              <NumberField label="Стоимость 1 возврата, ₽" value={costPerReturn} onChange={setCostPerReturn} />
              <NumberField label="Логистика / заказ, ₽" value={logisticsCostPerOrder} onChange={setLogisticsCostPerOrder} />
              <div className="col-span-2">
                <NumberField label="Contribution с успешной продажи, ₽" value={contributionPerSale} onChange={setContributionPerSale} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile label="Return rate" value={fmtPct(rRate)} status={rRate < 0.15 ? "good" : rRate < 0.25 ? "warning" : "critical"} />
              <KpiTile label="Успешные продажи" value={fmtNum(successfulSales)} />
              <KpiTile label="Доп. расходы от возвратов" value={fmtRub(impact)} status="critical" />
              <KpiTile label="Cost / successful sale" value={fmtRub(costPerSuccessful)} />
              <div className="col-span-2">
                <KpiTile
                  label="Contribution после возвратов"
                  value={fmtRub(contributionAfterReturns)}
                  status={contributionAfterReturns > 0 ? "good" : "critical"}
                />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <WhyChain
        steps={[
          "Return rate растёт с 15% до 25%",
          "На каждые 100 заказов на 10 больше требуют обратной логистики",
          "Расходы на возврат ложатся на всё меньшее число успешных продаж",
          "Logistics cost per successful sale растёт непропорционально росту return rate",
          "Contribution margin падает — даже если цена и объём продаж не изменились",
        ]}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m10", score, total)} />
    </ModulePage>
  );
}
