import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { DecisionCaseBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";

interface Link {
  step: string;
  happens: string;
  owner: string;
  data: string;
  cost: string;
  risk: string;
  kpi: string;
}

const chain: Link[] = [
  {
    step: "Seller warehouse / поставщик",
    happens: "Товар произведён/закуплен и готов к отправке в систему WB",
    owner: "Продавец (вы)",
    data: "SKU, себестоимость, объём, вес",
    cost: "Себестоимость, упаковка, локальная логистика",
    risk: "Ошибки в карточке товара, недостаточный запас",
    kpi: "Lead time производства/закупки",
  },
  {
    step: "FBS или FBW",
    happens: "Выбор: хранить у себя и собирать на заказ (FBS) или отгрузить на склад WB заранее (FBW)",
    owner: "Продавец — стратегическое решение",
    data: "Sales velocity, объём, маржа по SKU",
    cost: "Разный: FBS — операционные расходы продавца, FBW — логистика + хранение WB",
    risk: "Неверный выбор модели удорожает логистику или создаёт stockout",
    kpi: "Cost per order по каждой модели",
  },
  {
    step: "Склад / Sorting Center WB",
    happens: "Приёмка, размещение или пересортировка товара под региональные заказы",
    owner: "Wildberries",
    data: "Остатки по складам, коэффициент приёмки",
    cost: "Логистический тариф, хранение сверх бесплатного периода",
    risk: "Задержки приёмки, превышение capacity склада",
    kpi: "Скорость приёмки, % возвратов при приёмке",
  },
  {
    step: "Транспорт (Middle Mile)",
    happens: "Перемещение между сортировочными центрами и региональными складами",
    owner: "Wildberries / транспортные партнёры",
    data: "Маршруты, сроки, коэффициент логистики по направлению",
    cost: "Логистический тариф уже включает эту часть для продавца",
    risk: "Задержки маршрутов в пиковые периоды (распродажи)",
    kpi: "Время в пути между узлами",
  },
  {
    step: "ПВЗ (Pickup Point)",
    happens: "Товар прибывает в точку, ближайшую к клиенту",
    owner: "Партнёр ПВЗ",
    data: "Срок хранения на ПВЗ, статус заказа",
    cost: "Уже включена в логистический тариф",
    risk: "Товар не выкуплен клиентом → возврат",
    kpi: "% выкупа (buyout rate)",
  },
  {
    step: "Клиент",
    happens: "Получение, осмотр, решение о покупке или возврате",
    owner: "Клиент",
    data: "Решение о выкупе, оценка, отзыв",
    cost: "—",
    risk: "Отказ из-за несоответствия ожиданиям",
    kpi: "Рейтинг доставки, конверсия в выкуп",
  },
  {
    step: "Возврат",
    happens: "Если клиент отказался — обратное движение товара",
    owner: "Wildberries → продавец",
    data: "Причина возврата",
    cost: "Стоимость обратной логистики + потеря товарного вида",
    risk: "Рост доли возвратов разрушает unit economics",
    kpi: "Return rate, cost per return",
  },
];

const quizQuestions = [
  {
    question: "Что определяет, на каком складе WB окажется товар при FBW?",
    options: [
      "Продавец сам решает и физически везёт товар на конкретный региональный склад",
      "Wildberries распределяет товар по своей сети складов на основе спроса и логики системы",
      "Товар всегда попадает на ближайший к продавцу склад",
      "Это решается случайным образом",
    ],
    correctIndex: 1,
    explanation: "При FBW продавец поставляет товар на приёмный склад WB, дальнейшее распределение по региональным складам — задача самой системы Wildberries, исходя из прогноза спроса.",
  },
  {
    question: "Почему buyout rate (% выкупа) — важный показатель именно на этапе ПВЗ?",
    options: [
      "Потому что он не связан с логистикой",
      "Потому что низкий buyout rate означает, что логистические расходы на доставку были понесены впустую",
      "Потому что это показатель качества упаковки",
      "Потому что это единственный KPI склада",
    ],
    correctIndex: 1,
    explanation: "Если клиент не выкупает товар, вся цепочка доставки «туда» уже оплачена продавцом, и добавляется стоимость обратной логистики — двойной удар по экономике.",
  },
];

export function M02Wildberries() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m02"
      number="02"
      title="How Wildberries Logistics Works — Логистика Wildberries как система"
      level="Beginner"
      intro="Wildberries — это не просто витрина. Это логистическая система с собственными складами, сортировочными центрами и правилами. Разберём её как цепочку звеньев, у каждого из которых есть свои данные, расходы, риски и KPI."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Путь товара внутри Wildberries" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Seller", subtitle: "Продавец", tone: "blue" },
              { title: "Warehouse / поставщик", subtitle: "Склад продавца", tone: "blue" },
              { title: "FBS или FBW", subtitle: "Развилка модели", tone: "violet" },
              { title: "Склад / SC WB", subtitle: "Приёмка, размещение", tone: "aqua" },
              { title: "Сортировка", subtitle: "Sorting Center", tone: "aqua" },
              { title: "Транспорт", subtitle: "Middle/Last mile", tone: "orange" },
              { title: "ПВЗ", subtitle: "Pickup point", tone: "orange" },
              { title: "Клиент", subtitle: "Покупка / отказ", tone: "orange" },
              { title: "Возврат", subtitle: "Обратная логистика", tone: "red" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="Роль каждого звена: что происходит, кто отвечает, какие расходы и риски" />
        <div className="flex flex-col gap-3">
          {chain.map((l) => (
            <Card key={l.step}>
              <CardTitle>{l.step}</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Что происходит:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.happens}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Кто отвечает:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.owner}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Данные:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.data}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Расходы:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.cost}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Риски:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.risk}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    KPI:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{l.kpi}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <DecisionCaseBlock
        title="Case: заказ дошёл до ПВЗ, но клиент его не забрал"
        fields={{
          situation: "SKU с хорошей sales velocity, но buyout rate всего 55% — почти половина заказов не выкупается.",
          data: "Средний цикл доставки 4 дня, стоимость доставки в одну сторону 180 ₽, доля возвратов по причине «передумал» — 40% от всех возвратов.",
          problem: "Компания оплачивает полный цикл доставки для товара, который в итоге не продаётся.",
          options: (
            <>
              (1) Оставить как есть; (2) улучшить карточку товара и фото, чтобы снизить «expectation mismatch»; (3)
              пересмотреть цену; (4) ограничить регионы доставки с историческим низким buyout rate.
            </>
          ),
          economics: "Каждый невыкупленный заказ стоит примерно 2× стоимость доставки в одну сторону (туда и обратно) плюс потеря товарного вида при повторных пересылках.",
          risk: "Ограничение регионов может снизить общий объём продаж, если сделано без анализа причин отказа.",
          decision: "В первую очередь — устранить причину (карточка/фото/описание), а не симптом (регион доставки).",
          expectedResult: "Рост buyout rate напрямую снижает logistics cost per successful sale — метрику из Модуля 04.",
        }}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m02", score, total)} />
    </ModulePage>
  );
}
