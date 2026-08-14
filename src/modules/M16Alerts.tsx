import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, StatusDot, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";
import { Link } from "react-router-dom";

interface AlertDef {
  level: "critical" | "warning";
  name: string;
  problem: string;
  cause: string;
  impact: string;
  action: string;
}

const alerts: AlertDef[] = [
  { level: "critical", name: "Stockout risk", problem: "Days of stock ниже времени, нужного на пополнение (lead time)", cause: "Рост продаж, задержка cargo-партии, ошибка прогноза", impact: "Прямая упущенная выручка, падение рейтинга SKU", action: "Ускорить cargo-отправку (Модуль 21) или экстренно перебросить сток между складами (Модуль 08)" },
  { level: "warning", name: "Overstock", problem: "Days of stock значительно выше нормы для категории", cause: "Прогноз спроса завышен, продажи замедлились", impact: "Замороженный капитал, рост стоимости хранения", action: "Пересмотреть план поставок, рассмотреть промо для ускорения оборота" },
  { level: "critical", name: "High return rate", problem: "Return rate SKU/категории выше порога (напр. 25%)", cause: "Проблема с размерной сеткой, качеством, описанием товара", impact: "Рост cost per successful sale, падение contribution margin", action: "Проверить топ причины возврата (Модуль 10), обновить карточку товара" },
  { level: "critical", name: "Logistics cost increased", problem: "Логистика как % от выручки выросла относительно нормы", cause: "Изменение тарифов WB, рост доли крупногабарита, смена регионов доставки", impact: "Прямое давление на contribution margin", action: "Проверить объём упаковки (Модуль 05) и локализацию (Модуль 09)" },
  { level: "warning", name: "Warehouse capacity > 85%", problem: "Склад приближается к пределу ёмкости", cause: "Поступления превышают темп отгрузки", impact: "Риск отказа в приёмке новых поставок", action: "Перераспределить сток на менее загруженные склады заранее" },
  { level: "critical", name: "FBS processing delay", problem: "Order processing time превышает SLA", cause: "Недостаточная пропускная способность склада относительно объёма заказов", impact: "Late shipment rate растёт, штрафы и падение рейтинга", action: "Проверить utilization склада (Модуль 11), временно усилить смену" },
  { level: "warning", name: "Sales velocity declining", problem: "Скорость продаж SKU падает третью неделю подряд", cause: "Сезонность, усиление конкуренции, проблема с карточкой товара", impact: "Риск накопления излишков, если не скорректировать план поставок", action: "Пересчитать reorder point (Модуль 07) с учётом нового темпа" },
  { level: "warning", name: "Wrong warehouse allocation", problem: "Mismatch score между спросом и запасом растёт", cause: "Спрос сместился географически быстрее, чем сток", impact: "Удлинение доставки, рост доли дальних отправок", action: "Пересчитать распределение по складам (Модуль 08/09)" },
];

const quizQuestions = [
  {
    question: "Почему у каждого алерта в системе четыре обязательных поля (Problem → Cause → Impact → Action)?",
    options: [
      "Это просто формат отображения, без функционального смысла",
      "Потому что алерт без причины и действия — просто шум: он должен сразу подсказывать, что делать, а не только что 'что-то не так'",
      "Cause и Action нужны только для критичных алертов",
      "Impact всегда одинаков для всех алертов",
    ],
    correctIndex: 1,
    explanation: "Алерт без понятного действия заставляет человека каждый раз заново разбираться в ситуации — цель системы алертов в том, чтобы сократить время между обнаружением и правильной реакцией.",
  },
];

export function M16Alerts() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m16"
      number="16"
      title="Alerts — система автоматических предупреждений"
      level="Manager"
      intro="Каждый алерт — это не просто уведомление, а мини-диагноз: что произошло, почему, чем грозит и что делать. Часть этих алертов уже живут на боевом Дашборде и пересчитываются от текущих данных."
    >
      <Card>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Живую версию части этого каталога, посчитанную от текущих данных компании, смотрите на{" "}
          <Link to="/dashboard" className="underline" style={{ color: "var(--series-1)" }}>Дашборде руководителя</Link>.
        </p>
      </Card>

      <section>
        <SectionHeading eyebrow="Concept" title="Каталог алертов" />
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <Card key={a.name}>
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={a.level} />
                <CardTitle>{a.name}</CardTitle>
                {a.level === "critical" && <Pill tone="red">Critical</Pill>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Problem: </span><span style={{ color: "var(--text-secondary)" }}>{a.problem}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Cause: </span><span style={{ color: "var(--text-secondary)" }}>{a.cause}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Impact: </span><span style={{ color: "var(--text-secondary)" }}>{a.impact}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Action: </span><span style={{ color: "var(--text-secondary)" }}>{a.action}</span></div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m16", score, total)} />
    </ModulePage>
  );
}
