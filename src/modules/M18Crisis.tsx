import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";

interface CrisisCase {
  name: string;
  identify: string;
  impact: string;
  priority: string;
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
}

const cases: CrisisCase[] = [
  {
    name: "Закрытие склада",
    identify: "Склад приостановил приём/отгрузку (форс-мажор, проверка, техническая авария).",
    impact: "Заказы зоны обслуживания склада под угрозой срыва; риск stockout в регионе.",
    priority: "Максимальный — влияет на выручку немедленно.",
    shortTerm: "Перенаправить заказы и сток на соседние склады.",
    mediumTerm: "Оценить срок закрытия, спланировать cargo/транспорт под альтернативный склад.",
    longTerm: "Держать резервную ёмкость на 1-2 соседних складах на случай повтора.",
  },
  {
    name: "Задержка поставки",
    identify: "Cargo-партия или поставка от поставщика не приходит в плановый срок.",
    impact: "Days of stock сокращается быстрее плана, риск reorder point не покрыт вовремя.",
    priority: "Высокий, если days of stock приближается к нулю.",
    shortTerm: "Проверить альтернативный резерв стока на других складах.",
    mediumTerm: "Ускорить следующую поставку, пересмотреть перевозчика при системной проблеме.",
    longTerm: "Увеличить safety stock для этого маршрута/поставщика на будущее.",
  },
  {
    name: "Stockout",
    identify: "Остаток SKU достиг нуля при живом спросе.",
    impact: "Прямая упущенная выручка, падение позиций товара в поиске WB.",
    priority: "Высокий для топ-SKU по выручке.",
    shortTerm: "Экстренная переброска стока, если физически доступен где-то в системе.",
    mediumTerm: "Ускоренная cargo-поставка (Модуль 21).",
    longTerm: "Пересчитать reorder point и safety stock (Модуль 07) — stockout сигнализирует об ошибке в параметрах.",
  },
  {
    name: "Транспортный сбой",
    identify: "Перевозчик сорвал рейс/маршрут (поломка, отказ, форс-мажор).",
    impact: "Задержка партии в пути, риск не успеть к плановой дате поступления.",
    priority: "Средний-высокий, зависит от того, насколько критична партия.",
    shortTerm: "Связаться с альтернативным перевозчиком/3PL.",
    mediumTerm: "Пересчитать lead time и уведомить о сдвиге даты пополнения.",
    longTerm: "Работать минимум с двумя перевозчиками на ключевых маршрутах (Модуль 13/21).",
  },
  {
    name: "Рост тарифов",
    identify: "WB или транспортный партнёр объявил рост тарифа.",
    impact: "Прямое давление на contribution margin по затронутым SKU/категориям.",
    priority: "Высокий, если маржа по категории уже низкая.",
    shortTerm: "Пересчитать unit economics по каждому SKU (Модуль 04).",
    mediumTerm: "Пересмотреть цену, упаковку или модель фулфилмента для SKU на грани убыточности.",
    longTerm: "Заложить буфер маржи заранее для категорий с историей роста тарифов.",
  },
  {
    name: "Внезапный всплеск спроса",
    identify: "Продажи SKU резко выросли (виральность, тренд, конкурент ушёл с рынка).",
    impact: "Риск быстрого stockout, упущенная выручка от нереализованного спроса.",
    priority: "Высокий, пока окно спроса открыто.",
    shortTerm: "Экстренно перебросить весь доступный сток.",
    mediumTerm: "Оценить устойчивость всплеска, спланировать дополнительную cargo-поставку при подтверждении тренда.",
    longTerm: "Держать процесс быстрой реакции на всплески как стандартную процедуру, не разовое решение.",
  },
  {
    name: "Внезапное падение спроса",
    identify: "Продажи SKU резко упали (сезон закончился, вышел конкурент, негативный отзыв).",
    impact: "Риск overstock, рост стоимости хранения, замороженный капитал.",
    priority: "Средний — не угрожает выручке немедленно, но накапливает убыток.",
    shortTerm: "Приостановить или сократить плановые поставки.",
    mediumTerm: "Рассмотреть промо/скидку для ускорения оборота остатка.",
    longTerm: "Разобраться в причине падения — временная или структурная — прежде чем менять план на будущее.",
  },
  {
    name: "Волна возвратов",
    identify: "Return rate резко вырос по SKU/категории.",
    impact: "Рост cost per successful sale, падение contribution margin (Модуль 10).",
    priority: "Высокий, если затрагивает высокооборотный SKU.",
    shortTerm: "Проверить топ причины возврата за последние дни.",
    mediumTerm: "Исправить карточку товара / размерную сетку / выявить брак в партии.",
    longTerm: "Встроить регулярный мониторинг return rate как алерт (Модуль 16), а не разовую проверку.",
  },
  {
    name: "Затор в FBS-обработке",
    identify: "Order processing time и late shipment rate резко выросли.",
    impact: "Штрафы WB, падение рейтинга, риск отмены заказов.",
    priority: "Высокий — влияет на все заказы, не только на один SKU.",
    shortTerm: "Экстренно усилить смену, приоритизировать заказы по срокам отгрузки.",
    mediumTerm: "Проверить пропускную способность склада против фактического объёма (Модуль 11).",
    longTerm: "Планировать пропускную способность заранее под известные пики (распродажи, сезон).",
  },
  {
    name: "Задержка у поставщика",
    identify: "Поставщик в Кыргызстане не успевает с производством/отгрузкой в срок.",
    impact: "Сдвигается весь lead time (Модуль 21), под угрозой следующая cargo-партия.",
    priority: "Средний-высокий, зависит от текущего запаса буфера.",
    shortTerm: "Уточнить новый срок готовности, пересчитать buffer stock под новый lead time.",
    mediumTerm: "Рассмотреть частичную отгрузку того, что уже готово, не дожидаясь полной партии.",
    longTerm: "Работать с 2+ поставщиками по критичным SKU, чтобы не зависеть от одной точки отказа.",
  },
];

const quizQuestions = [
  {
    question: "В чём разница между 'short-term response' и 'long-term prevention' в разборе кризиса?",
    options: [
      "Это одно и то же, просто разные слова",
      "Short-term устраняет немедленное последствие, long-term меняет систему так, чтобы кризис не повторялся тем же образом",
      "Long-term всегда дороже short-term",
      "Short-term применяется только к транспортным сбоям",
    ],
    correctIndex: 1,
    explanation: "Short-term — тушим пожар сейчас. Long-term prevention — меняем reorder point, работаем с несколькими поставщиками, держим резервную ёмкость — то, что снижает вероятность или силу следующего похожего случая.",
  },
];

export function M18Crisis() {
  const { recordQuiz } = useProgress();
  const [active, setActive] = useState(cases[0]);

  return (
    <ModulePage
      moduleId="m18"
      number="18"
      title="Crisis Management — что делать, когда логистика ломается"
      level="Director"
      intro="Десять типовых кризисов и единый формат разбора: Identify → Estimate impact → Prioritize → Short-term → Medium-term → Long-term prevention."
    >
      <section>
        <SectionHeading eyebrow="Cases" title="Выберите ситуацию" />
        <div className="flex gap-2 flex-wrap mb-4">
          {cases.map((c) => (
            <button
              key={c.name}
              onClick={() => setActive(c)}
              className="text-sm rounded-lg px-3 py-1.5 border"
              style={{
                background: active.name === c.name ? "var(--series-8)" : "transparent",
                color: active.name === c.name ? "white" : "var(--text-primary)",
                borderColor: active.name === c.name ? "var(--series-8)" : "var(--border)",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <Card>
          <CardTitle>{active.name}</CardTitle>
          <div className="flex flex-col gap-3 text-sm">
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>1. Identify problem: </span><span style={{ color: "var(--text-secondary)" }}>{active.identify}</span></div>
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>2. Estimate impact: </span><span style={{ color: "var(--text-secondary)" }}>{active.impact}</span></div>
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>3. Priority: </span><span style={{ color: "var(--text-secondary)" }}>{active.priority}</span></div>
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>4. Short-term response: </span><span style={{ color: "var(--text-secondary)" }}>{active.shortTerm}</span></div>
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>5. Medium-term response: </span><span style={{ color: "var(--text-secondary)" }}>{active.mediumTerm}</span></div>
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>6. Long-term prevention: </span><span style={{ color: "var(--text-secondary)" }}>{active.longTerm}</span></div>
          </div>
        </Card>
      </section>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m18", score, total)} />
    </ModulePage>
  );
}
