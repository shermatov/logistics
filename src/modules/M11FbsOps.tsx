import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { ManagerQuestionBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { fmtNum, fmtPct } from "../lib/formulas";

const kpis: [string, string][] = [
  ["Order processing time", "Время от получения заказа до передачи в сборку"],
  ["Late shipment rate", "Доля заказов, отправленных позже установленного SLA"],
  ["Cancellation rate", "Доля заказов, отменённых из-за несоблюдения срока сборки"],
  ["Assembly accuracy", "Доля заказов, собранных без ошибок в составе"],
  ["Packing accuracy", "Доля заказов без повреждений упаковки при приёмке WB"],
  ["Delivery rating", "Оценка клиентами скорости и качества доставки"],
  ["Orders per employee", "Заказов, обрабатываемых одним сотрудником в смену"],
  ["Productivity per hour", "Заказов, собираемых в среднем за час пиковой нагрузки"],
];

const quizQuestions = [
  {
    question: "Если late shipment rate растёт, а cancellation rate растёт следом — что это обычно означает?",
    options: [
      "Проблема на этапе доставки WB, не связанная со складом",
      "Узкое место находится где-то до момента передачи заказа — сборка не успевает за срок SLA",
      "Слишком высокое качество упаковки",
      "Это не связанные показатели",
    ],
    correctIndex: 1,
    explanation: "Cancellation после late shipment почти всегда сигнализирует, что склад физически не укладывается в срок сборки — нужно смотреть на orders per employee и productivity per hour в пиковые часы.",
  },
];

export function M11FbsOps() {
  const { recordQuiz } = useProgress();
  const [employees, setEmployees] = useState(6);
  const [shiftHours, setShiftHours] = useState(10);
  const [ordersPerHourPerEmployee, setOrdersPerHourPerEmployee] = useState(14);
  const [ordersToday, setOrdersToday] = useState(900);

  const capacity = employees * shiftHours * ordersPerHourPerEmployee;
  const utilization = ordersToday / capacity;

  return (
    <ModulePage
      moduleId="m11"
      number="11"
      title="FBS Operations — операционный workflow"
      level="Operator"
      intro="При FBS вся ответственность за срок сборки лежит на вас. Разберём цепочку операций и метрики, которые показывают, где реально теряется время."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Операционный workflow" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Order received", subtitle: "Заказ получен", tone: "blue" },
              { title: "Processing", subtitle: "Обработка", tone: "blue" },
              { title: "Picking", subtitle: "Сборка", tone: "aqua" },
              { title: "Packing", subtitle: "Упаковка", tone: "aqua" },
              { title: "Labeling", subtitle: "Маркировка", tone: "aqua" },
              { title: "Handover", subtitle: "Передача перевозчику", tone: "orange" },
              { title: "WB acceptance", subtitle: "Приёмка WB", tone: "orange" },
              { title: "Sorting", subtitle: "Сортировка", tone: "orange" },
              { title: "Delivery", subtitle: "Доставка", tone: "orange" },
            ]}
          />
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Типичные точки ошибок: <strong>Picking</strong> (пересорт, недостача) и <strong>Handover</strong>{" "}
            (не успели передать до отсечки транспортной компании — это напрямую превращается в late shipment).
          </p>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="KPI операций FBS" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {kpis.map(([name, desc]) => (
            <Card key={name}>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Проверка пропускной способности склада" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Сотрудников на сборке" value={employees} onChange={setEmployees} />
              <NumberField label="Часов в смене" value={shiftHours} onChange={setShiftHours} />
              <NumberField label="Заказов/час на сотрудника" value={ordersPerHourPerEmployee} onChange={setOrdersPerHourPerEmployee} />
              <NumberField label="Заказов сегодня" value={ordersToday} onChange={setOrdersToday} />
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile label="Пропускная способность" value={`${fmtNum(capacity)} заказов/смену`} />
              <KpiTile
                label="Загрузка склада"
                value={fmtPct(utilization)}
                status={utilization < 0.8 ? "good" : utilization < 1 ? "warning" : "critical"}
              />
            </div>
          </div>
          {utilization > 1 && (
            <p className="text-xs mt-4 rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--status-critical)" }}>
              Пропускная способность превышена — часть заказов гарантированно уйдёт с опозданием без дополнительной смены/персонала.
            </p>
          )}
        </Card>
      </section>

      <ManagerQuestionBlock
        scenario={
          <>
            Late shipment rate вырос с 3% до 11% за две недели. Orders per employee не изменился. Orders today вырос
            на 35% из-за начала распродажи.
          </>
        }
        question="Это проблема людей, процесса или спроса? Что вы делаете сегодня и что — на следующей неделе?"
        seniorAnswer={
          <>
            Раз orders per employee (индивидуальная производительность) не изменился, а вырос только объём — это
            проблема <strong>спроса, превысившего пропускную способность</strong>, а не проблема людей или процесса.
            Сегодня: временная смена/сверхурочные, приоритизация заказов с ближайшей отсечкой отгрузки. На неделю:
            пересчитать плановую пропускную способность под сезон распродаж заранее в следующий раз (это
            предсказуемое событие), и рассмотреть частичный перевод части SKU на FBW на период пиков, если экономика
            это оправдывает (Модуль 14).
          </>
        }
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m11", score, total)} />
    </ModulePage>
  );
}
