import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { DecisionCaseBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { calcOwnWarehouseCost, fmtRub, fmtNum } from "../lib/formulas";

const quizQuestions = [
  {
    question: "Почему 'cost per order' и 'cost per unit' — разные и оба нужны?",
    options: [
      "Это одно и то же число, названное по-разному",
      "Cost per order показывает стоимость операции сборки заказа, cost per unit — стоимость на физическую единицу товара; заказы с разным числом позиций дают разную картину по каждой метрике",
      "Cost per unit не имеет отношения к складским расходам",
      "Только cost per order важен для принятия решений",
    ],
    correctIndex: 1,
    explanation: "Если в среднем заказе 2.3 единицы товара, cost per unit будет ниже cost per order — обе метрики нужны для разных решений (ценообразование по SKU vs общая эффективность операций).",
  },
];

export function M12OwnWarehouse() {
  const { recordQuiz } = useProgress();
  const [rent, setRent] = useState(320000);
  const [labor, setLabor] = useState(680000);
  const [packaging, setPackaging] = useState(95000);
  const [equipment, setEquipment] = useState(40000);
  const [utilities, setUtilities] = useState(55000);
  const [software, setSoftware] = useState(30000);
  const [errors, setErrors] = useState(25000);
  const [returnsCost, setReturnsCost] = useState(120000);

  const [orders, setOrders] = useState(9000);
  const [units, setUnits] = useState(19500);
  const [employees, setEmployees] = useState(14);
  const [hoursPerPeriod, setHoursPerPeriod] = useState(22 * 10);

  const result = calcOwnWarehouseCost(
    { rent, labor, packaging, equipment, utilities, software, errors, returns: returnsCost },
    { orders, units, employees, hoursPerPeriod }
  );

  return (
    <ModulePage
      moduleId="m12"
      number="12"
      title="Own Warehouse Economics — экономика собственного склада"
      level="Manager"
      intro="Если вы работаете по FBS через собственный fulfillment, у вас есть полноценный P&L склада — не только 'логистика', а отдельная операционная единица со своей себестоимостью."
    >
      <section>
        <SectionHeading eyebrow="Calculation" title="Warehouse Operating Cost (за месяц)" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Аренда, ₽" value={rent} onChange={setRent} />
              <NumberField label="Труд (ФОТ), ₽" value={labor} onChange={setLabor} />
              <NumberField label="Упаковка, ₽" value={packaging} onChange={setPackaging} />
              <NumberField label="Оборудование, ₽" value={equipment} onChange={setEquipment} />
              <NumberField label="Коммунальные, ₽" value={utilities} onChange={setUtilities} />
              <NumberField label="Софт/системы, ₽" value={software} onChange={setSoftware} />
              <NumberField label="Ошибки/потери, ₽" value={errors} onChange={setErrors} />
              <NumberField label="Возвраты (обработка), ₽" value={returnsCost} onChange={setReturnsCost} />
            </div>
            <div>
              <div className="rounded-lg border overflow-hidden mb-3" style={{ borderColor: "var(--border)" }}>
                {[
                  ["Аренда", rent],
                  ["Труд", labor],
                  ["Упаковка", packaging],
                  ["Оборудование", equipment],
                  ["Коммунальные", utilities],
                  ["Софт", software],
                  ["Ошибки", errors],
                  ["Возвраты", returnsCost],
                ].map(([label, value], i, arr) => (
                  <div key={label as string} className="flex items-center justify-between px-3 py-1.5 text-sm" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <span className="tabular" style={{ color: "var(--text-primary)" }}>{fmtRub(value as number)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
                  <span style={{ color: "var(--text-primary)" }}>Warehouse Operating Cost</span>
                  <span className="tabular" style={{ color: "var(--text-primary)" }}>{fmtRub(result.totalOperatingCost)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Объём операций и производительность" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Заказов за период" value={orders} onChange={setOrders} />
              <NumberField label="Единиц товара за период" value={units} onChange={setUnits} />
              <NumberField label="Сотрудников" value={employees} onChange={setEmployees} />
              <NumberField label="Рабочих часов за период" value={hoursPerPeriod} onChange={setHoursPerPeriod} />
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile label="Cost per order" value={fmtRub(result.costPerOrder)} />
              <KpiTile label="Cost per unit" value={fmtRub(result.costPerUnit)} />
              <KpiTile label="Cost per employee" value={fmtRub(result.costPerEmployee)} />
              <KpiTile label="Orders / hour" value={fmtNum(result.ordersPerHour, 1)} />
            </div>
          </div>
        </Card>
      </section>

      <DecisionCaseBlock
        title="Case: свой склад или аутсорс fulfillment-партнёру"
        fields={{
          situation: "Cost per order на собственном складе оказался выше, чем предложение стороннего fulfillment-партнёра.",
          data: "Собственный склад: cost per order выше на 15%, но даёт полный контроль над качеством сборки и скоростью реакции на пики.",
          problem: "Формально аутсорс дешевле — но это разовое сравнение по одной метрике.",
          options: "(1) Полностью перейти на аутсорс; (2) остаться на своём складе; (3) гибрид — часть объёма аутсорсить в пиковые периоды.",
          economics: "Собственный склад имеет высокую долю постоянных расходов (аренда, часть ФОТ) — cost per order падает при росте объёма. Аутсорс почти полностью переменный.",
          risk: "Аутсорс снижает контроль над качеством сборки и скоростью реакции на срочные изменения; собственный склад несёт риск простаивающих постоянных расходов при падении спроса.",
          decision: "Если объём растёт и стабилен — считать точку безубыточности собственного склада против переменной ставки аутсорса за 6–12 месяцев, а не за один период.",
          expectedResult: "При росте объёма собственный склад обычно догоняет и обгоняет аутсорс по cost per order за счёт постоянных расходов, размазанных на больший объём.",
        }}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m12", score, total)} />
    </ModulePage>
  );
}
