import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";

interface TradeOff {
  left: string;
  right: string;
  leftGood: string;
  rightGood: string;
  question: string;
}

const tradeOffs: TradeOff[] = [
  {
    left: "Centralized Inventory",
    right: "Distributed Inventory",
    leftGood: "Ниже стоимость хранения, проще прогнозировать, меньше капитала на дублирование стока",
    rightGood: "Быстрее доставка в регионы, ниже mismatch score, выше устойчивость к отказу одного склада",
    question: "Насколько предсказуем и географически растянут спрос? Чем предсказуемее по региону — тем безопаснее распределять.",
  },
  {
    left: "FBS",
    right: "FBW",
    leftGood: "Меньше замороженного капитала, гибкость под непредсказуемый спрос",
    rightGood: "Быстрее доставка клиенту, ниже cost per order при стабильном спросе",
    question: "Насколько стабилен и предсказуем спрос конкретного SKU? (Полный разбор — Модуль 03 и 14.)",
  },
  {
    left: "Own Warehouse",
    right: "3PL",
    leftGood: "Полный контроль качества и скорости реакции, дешевле при большом стабильном объёме",
    rightGood: "Нет постоянных расходов, быстрый старт, легко масштабировать вниз при падении спроса",
    question: "Насколько стабилен объём и есть ли команда для управления складом? (Модуль 12.)",
  },
  {
    left: "Internal Fulfillment",
    right: "Outsourcing",
    leftGood: "Контроль над качеством сборки и упаковки, прямая связь с клиентским опытом",
    rightGood: "Быстрый выход в новые регионы без капитальных вложений",
    question: "Является ли качество фулфилмента частью бренда компании или это commodity-операция?",
  },
  {
    left: "High Stock",
    right: "Lean Stock",
    leftGood: "Низкий риск stockout, устойчивость к всплескам спроса",
    rightGood: "Меньше замороженного капитала, выше capital efficiency (Модуль 07)",
    question: "Насколько дорог для компании капитал сейчас, и насколько дорог stockout для конкретной категории?",
  },
  {
    left: "Fast Delivery",
    right: "Low Cost",
    leftGood: "Выше конверсия и рейтинг товара, лучше клиентский опыт",
    rightGood: "Выше contribution margin с каждой продажи",
    question: "Конкурируете ли вы в этой категории скоростью или ценой? Это редко можно выигрывать одновременно на полную мощность.",
  },
  {
    left: "Inventory Availability",
    right: "Capital Efficiency",
    leftGood: "Меньше упущенных продаж, стабильный рейтинг товара",
    rightGood: "Капитал свободен для роста ассортимента или маркетинга",
    question: "Что для компании сейчас дороже — упущенная продажа или связанный капитал?",
  },
];

const quizQuestions = [
  {
    question: "Почему в проекте намеренно НЕ утверждается, что 'распределённая модель всегда лучше централизованной'?",
    options: [
      "Потому что распределённая модель на самом деле хуже",
      "Потому что правильный выбор зависит от целей, ограничений, экономики и рисков конкретной компании и SKU — единого правильного ответа не существует",
      "Потому что централизация запрещена законом",
      "Потому что это не имеет значения на практике",
    ],
    correctIndex: 1,
    explanation: "Decision = Objective + Constraints + Economics + Risk — это ключевой принцип модуля: одна и та же стратегия может быть правильной для одной компании/SKU и неправильной для другой.",
  },
];

export function M19Strategy() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m19"
      number="19"
      title="Logistics Strategy — логистическая стратегия"
      level="Director"
      intro="Стратегические решения в логистике почти всегда — компромиссы, а не поиск единственно верного ответа."
    >
      <Card>
        <CardTitle>
          Формула стратегического решения <Pill tone="blue">без единственно верного ответа</Pill>
        </CardTitle>
        <p className="text-lg font-semibold text-center py-3" style={{ color: "var(--text-primary)" }}>
          Decision = Objective + Constraints + Economics + Risk
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Одна и та же стратегия (например, «держать высокий сток») может быть верной для сезонного бестселлера с
          высокой маржой и ошибочной для нишевого SKU с низкой оборачиваемостью — потому что у них разные Constraints
          и Economics, даже если Objective («не терять продажи») одинаковый.
        </p>
      </Card>

      <section>
        <SectionHeading eyebrow="Concept" title="Ключевые trade-offs" />
        <div className="flex flex-col gap-3">
          {tradeOffs.map((t) => (
            <Card key={t.left}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "var(--series-1)" }}>{t.left}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.leftGood}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "var(--series-2)" }}>{t.right}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.rightGood}</div>
                </div>
              </div>
              <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}>
                <strong>Что определяет выбор: </strong>{t.question}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m19", score, total)} />
    </ModulePage>
  );
}
