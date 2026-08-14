import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { ManagerQuestionBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";

const rows: [string, string, string][] = [
  ["Inventory location", "Товар хранится у продавца", "Товар хранится на складе WB"],
  ["Storage", "Собственный склад / аренда", "Оплачивается по тарифам WB, есть бесплатный период"],
  ["Picking", "Продавец сам собирает заказ", "Делает WB на своём складе"],
  ["Packing", "Продавец", "WB (по своим стандартам)"],
  ["Order processing", "Продавец должен успеть обработать в срок WB", "Не требуется — товар уже готов к отгрузке"],
  ["Delivery", "Через приёмку WB после сборки", "Начинается сразу с ближайшего к клиенту склада WB"],
  ["Returns", "Возврат идёт к продавцу", "Возврат идёт на склад WB, может быть переразмещён"],
  ["Operational complexity", "Высокая: нужен свой процесс сборки", "Низкая для продавца после поставки"],
  ["Capital requirements", "Ниже — не нужно морозить сток на многих складах WB", "Выше — товар физически лежит на складах WB заранее"],
  ["Scalability", "Ограничена мощностью своего склада", "Масштабируется сетью WB, но требует точного прогноза"],
  ["Risk", "Риск не успеть собрать заказ в срок (SLA)", "Риск затоваривания / стоимость хранения при низком спросе"],
  ["Best use cases", "Низкая/непредсказуемая скорость продаж, новые SKU, высокий возврат, кастомизация", "Высокая и стабильная скорость продаж, низкий возврат, товар с длинным сроком годности"],
];

const quizQuestions = [
  {
    question: "Для какого SKU FBW обычно выгоднее?",
    options: [
      "Новый SKU без истории продаж",
      "SKU с высокой и стабильной скоростью продаж и низким return rate",
      "SKU с очень высокой сезонностью и коротким окном продаж",
      "SKU, который часто меняет характеристики (кастомизация)",
    ],
    correctIndex: 1,
    explanation: "FBW выгоден, когда прогноз продаж надёжен: товар не залёживается на складе WB, оборачиваемость высокая, а низкий return rate не создаёт лишних циклов обратной логистики.",
  },
  {
    question: "Главный операционный риск FBS — это...",
    options: [
      "Стоимость хранения на складе WB",
      "Не успеть собрать и передать заказ в срок (SLA) и получить штраф/понижение рейтинга",
      "Затоваривание на региональных складах",
      "Отсутствие доступа к аналитике WB",
    ],
    correctIndex: 1,
    explanation: "При FBS вся ответственность за скорость сборки лежит на продавце — просрочка сборки напрямую бьёт по рейтингу и штрафам.",
  },
  {
    question: "Почему FBW требует больше капитала, чем FBS?",
    options: [
      "Потому что комиссия WB выше при FBW",
      "Потому что товар физически лежит на складах WB заранее, оплаченный, но ещё не проданный",
      "Потому что упаковка при FBW дороже",
      "Это не так — капитала требуется одинаково",
    ],
    correctIndex: 1,
    explanation: "FBW означает предварительную поставку стока на склад(ы) WB — этот товар уже куплен и оплачен, но продажа ещё не случилась, то есть капитал заморожен дольше.",
  },
];

export function M03FbsFbw() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m03"
      number="03"
      title="FBS vs FBW — две разные операционные модели"
      level="Operator"
      intro="FBS и FBW — это не два способа сделать одно и то же. Это два разных набора компромиссов между капиталом, операционной сложностью и риском. Разбираем не определения, а последствия выбора."
    >
      <section>
        <SectionHeading eyebrow="Comparison model" title="FBS vs FBW по измерениям" />
        <Card padded={false}>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                    Dimension
                  </th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--series-1)" }}>
                    FBS
                  </th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--series-2)" }}>
                    FBW
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([dim, fbs, fbw], i) => (
                  <tr key={dim} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                    <td className="px-4 py-3 font-medium align-top" style={{ color: "var(--text-primary)" }}>
                      {dim}
                    </td>
                    <td className="px-4 py-3 align-top" style={{ color: "var(--text-secondary)" }}>
                      {fbs}
                    </td>
                    <td className="px-4 py-3 align-top" style={{ color: "var(--text-secondary)" }}>
                      {fbw}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardTitle>Когда выбирать FBS</CardTitle>
          <ul className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <li>— Новый SKU без истории продаж</li>
            <li>— Низкая или непредсказуемая скорость продаж</li>
            <li>— Высокий return rate (fashion, обувь)</li>
            <li>— Ограниченный капитал на предоплату стока WB</li>
            <li>— Товар требует индивидуальной сборки/кастомизации</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Когда выбирать FBW</CardTitle>
          <ul className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <li>— Высокая и стабильная скорость продаж</li>
            <li>— Низкий return rate</li>
            <li>— Товар с длинным сроком годности/актуальности</li>
            <li>— Достаточно капитала для предварительного стока</li>
            <li>— Нужна максимальная скорость доставки клиенту</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Когда использовать hybrid</CardTitle>
          <ul className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <li>— Топ-SKU (20% ассортимента, 80% продаж) → FBW</li>
            <li>— Длинный хвост и новинки → FBS</li>
            <li>— Сезонный пик → временно докупить FBW-сток</li>
            <li>— Постоянно пересматривать порог по данным, не один раз</li>
          </ul>
        </Card>
      </section>

      <ManagerQuestionBlock
        scenario={
          <>
            У вас два SKU: <strong>SKU-A</strong> — продаётся стабильно 40 шт/день, return rate 8%, товар без срока
            годности. <strong>SKU-B</strong> — новая коллекция, продажи скачут от 2 до 15 шт/день, return rate 35%
            (одежда, проблема с размерами).
          </>
        }
        question="Какую модель фулфилмента вы бы выбрали для каждого SKU и почему? Что бы вы стали отслеживать в первые 4 недели, чтобы проверить решение?"
        seniorAnswer={
          <>
            SKU-A — кандидат на <strong>FBW</strong>: стабильный спрос снижает риск затоваривания, низкий возврат не
            создаёт нагрузку на обратную логистику. SKU-B — <strong>FBS</strong> на старте: непредсказуемый спрос +
            высокий возврат — комбинация, которая на FBW заморозила бы капитал и создала бы риск излишков на складе
            WB. Через 4 недели нужно отслеживать не общий объём продаж, а <em>стабильность</em> сигнала (сузился ли
            диапазон продаж день-к-дню) и тренд return rate — если он снижается (например, после доработки размерной
            сетки), SKU-B можно постепенно переводить на FBW.
          </>
        }
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m03", score, total)} />
    </ModulePage>
  );
}
