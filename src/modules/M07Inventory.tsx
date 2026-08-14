import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, TermPair, NumberField, SelectField } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { DecisionCaseBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { daysOfStock, reorderPoint, safetyStock, stockoutRisk, fmtNum } from "../lib/formulas";

const SERVICE_LEVELS = [
  { value: "90", label: "90% (z = 1.28)", z: 1.28 },
  { value: "95", label: "95% (z = 1.65)", z: 1.65 },
  { value: "98", label: "98% (z = 2.05)", z: 2.05 },
  { value: "99", label: "99% (z = 2.33)", z: 2.33 },
];

const TERMS: [string, string, string][] = [
  ["Страховой запас", "Safety Stock", "Буфер сверх ожидаемого спроса на случай колебаний спроса или задержки поставки."],
  ["Точка заказа", "Reorder Point", "Уровень запаса, при котором нужно разместить новый заказ на пополнение."],
  ["Время поставки", "Lead Time", "Время от размещения заказа до получения товара в наличии для продажи."],
  ["Дни запаса", "Days of Stock", "На сколько дней хватит текущего остатка при текущей скорости продаж."],
  ["Оборачиваемость запасов", "Stock Turnover", "Сколько раз запас 'обернулся' (продан и пополнен) за период."],
];

const quizQuestions = [
  {
    question: "SKU: продажи 200 шт/день, текущий остаток 1800 шт, lead time 5 дней, safety stock 500 шт. Когда пора заказывать пополнение?",
    options: [
      "Когда остаток упадёт до 1000 шт (reorder point = 200×5 + 0 без страхового запаса)",
      "Когда остаток упадёт до 1500 шт (reorder point = 200×5 + 500)",
      "Когда остаток упадёт до 500 шт",
      "Пополнение уже нужно было заказать",
    ],
    correctIndex: 1,
    explanation: "Reorder Point = Demand During Lead Time + Safety Stock = 200×5 + 500 = 1500. Текущий остаток 1800 ещё выше точки заказа, но уже близко — заказ нужно готовить.",
  },
  {
    question: "Что произойдёт с days of stock, если продажи внезапно вырастут в 2 раза, а остаток не изменится?",
    options: ["Days of stock вырастет в 2 раза", "Days of stock не изменится", "Days of stock сократится примерно в 2 раза", "Days of stock станет отрицательным"],
    correctIndex: 2,
    explanation: "Days of Stock = Inventory / Avg Daily Sales — при удвоении знаменателя (продаж) значение падает вдвое. Это классический сценарий, который приводит к неожиданному stockout после всплеска спроса.",
  },
];

export function M07Inventory() {
  const { recordQuiz } = useProgress();

  const [currentInventory, setCurrentInventory] = useState(1800);
  const [avgDailySales, setAvgDailySales] = useState(200);
  const [leadTimeDays, setLeadTimeDays] = useState(5);
  const [demandStdDev, setDemandStdDev] = useState(35);
  const [serviceLevel, setServiceLevel] = useState("95");

  const z = SERVICE_LEVELS.find((s) => s.value === serviceLevel)!.z;
  const ss = safetyStock(z, demandStdDev, leadTimeDays);
  const rop = reorderPoint(avgDailySales, leadTimeDays, ss);
  const dos = daysOfStock(currentInventory, avgDailySales);
  const risk = stockoutRisk(dos, leadTimeDays);

  return (
    <ModulePage
      moduleId="m07"
      number="07"
      title="Inventory Management — управление запасами"
      level="Analyst"
      intro="Формулы здесь простые. Сложность — в том, откуда брать входные переменные и когда доверять, а когда не доверять результату."
    >
      <section>
        <SectionHeading eyebrow="Concept" title="Ключевые термины" />
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {TERMS.map(([ru, en, desc]) => (
              <div key={ru}>
                <TermPair ru={ru} en={en} />
                <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Калькулятор запасов" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Текущий остаток, шт" value={currentInventory} onChange={setCurrentInventory} />
              <NumberField label="Средние продажи, шт/день" value={avgDailySales} onChange={setAvgDailySales} />
              <NumberField label="Lead time, дней" value={leadTimeDays} onChange={setLeadTimeDays} />
              <NumberField label="Стд. отклонение спроса, шт/день" value={demandStdDev} onChange={setDemandStdDev} />
              <div className="col-span-2">
                <SelectField
                  label="Целевой уровень сервиса"
                  value={serviceLevel}
                  onChange={setServiceLevel}
                  options={SERVICE_LEVELS.map((s) => ({ value: s.value, label: s.label }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile label="Days of Stock" value={`${fmtNum(dos, 1)} дн`} status={risk === "low" ? "good" : risk === "medium" ? "warning" : "critical"} />
              <KpiTile label="Stockout risk" value={risk === "low" ? "Низкий" : risk === "medium" ? "Средний" : "Высокий"} />
              <KpiTile label="Safety Stock" value={`${fmtNum(ss, 0)} шт`} sub={`z=${z} × σ=${demandStdDev} × √${leadTimeDays}`} />
              <KpiTile label="Reorder Point" value={`${fmtNum(rop, 0)} шт`} sub={currentInventory <= rop ? "Пора заказывать пополнение" : "Заказ пока не требуется"} status={currentInventory <= rop ? "warning" : "good"} />
            </div>
          </div>
          <div className="mt-4 text-xs rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            <strong>Формулы:</strong> Days of Stock = Inventory ÷ Avg Daily Sales · Safety Stock = z × σ_demand × √Lead
            Time · Reorder Point = (Avg Daily Sales × Lead Time) + Safety Stock.
          </div>
        </Card>
      </section>

      <DecisionCaseBlock
        title="Case: откуда взять σ (стандартное отклонение спроса), если данных мало"
        fields={{
          situation: "Новый SKU, продажи всего 3 недели, спрос скачет от 5 до 40 шт/день.",
          data: "Мало исторических точек — статистическая оценка σ ненадёжна.",
          problem: "Заниженный safety stock создаст stockout, завышенный — заморозит капитал.",
          options: (
            <>
              (1) Использовать σ похожего по категории и сезонности SKU; (2) взять консервативную оценку (высокий z)
              на первые недели; (3) сократить lead time вместо увеличения safety stock, если это возможно.
            </>
          ),
          economics: "Стоимость избыточного safety stock — это стоимость капитала и хранения; стоимость нехватки — упущенные продажи и падение рейтинга.",
          risk: "Для нового SKU риск асимметричен: ошибка в обе стороны дорога, но stockout ещё и портит рейтинг товара на старте.",
          decision: "Начать с консервативной оценки по аналогу, пересчитывать σ каждую неделю по мере накопления данных.",
          expectedResult: "Через 6–8 недель заменить приближение на собственную статистику SKU.",
        }}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m07", score, total)} />
    </ModulePage>
  );
}
