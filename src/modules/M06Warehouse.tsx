import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, TermPair } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { LevelStack } from "../components/lesson/LevelStack";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { ChallengeBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";

const quizQuestions = [
  {
    question: "Putaway — это этап, на котором...",
    options: [
      "Товар физически размещается на конкретную ячейку хранения после приёмки",
      "Клиент возвращает товар",
      "Заказ упаковывается для отправки",
      "Проверяется соответствие товара документам",
    ],
    correctIndex: 0,
    explanation: "Putaway следует сразу за receiving: товар получил своё место хранения, что определяет, насколько быстро его потом найдут при picking.",
  },
  {
    question: "Почему inventory accuracy (точность учёта остатков) критична для склада?",
    options: [
      "Это влияет только на бухгалтерию",
      "Неточный учёт приводит к продаже товара, которого физически нет в наличии, или к ложному stockout",
      "Это требование только для FBW",
      "Она не влияет на операционные показатели",
    ],
    correctIndex: 1,
    explanation: "Если система показывает наличие, а товара физически нет — заказ будет отменён после того, как клиент уже его оформил. Обратная ошибка создаёт ложный stockout и упущенные продажи.",
  },
];

export function M06Warehouse() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m06"
      number="06"
      title="Warehouse Management — управление складом"
      level="Operator"
      intro="Склад — это не место хранения, это процесс с чёткими этапами. Каждый этап либо ускоряет, либо замедляет весь путь товара к клиенту."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Прямой поток" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Receiving", subtitle: "Приёмка", tone: "blue" },
              { title: "Putaway", subtitle: "Размещение", tone: "blue" },
              { title: "Storage", subtitle: "Хранение", tone: "aqua" },
              { title: "Picking", subtitle: "Сборка", tone: "aqua" },
              { title: "Packing", subtitle: "Упаковка", tone: "orange" },
              { title: "Dispatch", subtitle: "Отгрузка", tone: "orange" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Visual" title="Обратный поток (возвраты)" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Return", subtitle: "Возврат принят", tone: "red" },
              { title: "Inspection", subtitle: "Проверка состояния", tone: "red" },
              { title: "Restock", subtitle: "Вернуть в продажу", tone: "aqua" },
              { title: "Quarantine", subtitle: "На проверку/ремонт", tone: "orange" },
              { title: "Disposal", subtitle: "Списание", tone: "red" },
            ]}
          />
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            После inspection у товара три пути — restock, quarantine или disposal. Решение здесь напрямую влияет на
            unit economics (Модуль 04) и глубоко разбирается в Модуле 10 «Возвраты».
          </p>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="Ключевые термины" />
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              ["Точность учёта остатков", "Inventory Accuracy"],
              ["Пропускная способность", "Throughput"],
              ["Ёмкость склада", "Warehouse Capacity"],
              ["Ошибка сборки", "Picking Error"],
              ["Производительность на человека", "Productivity per Employee"],
            ].map(([ru, en]) => (
              <TermPair key={ru} ru={ru} en={en} />
            ))}
          </div>
        </Card>
      </section>

      <LevelStack
        what={<>Управление складом — организация приёмки, хранения, сборки и отгрузки так, чтобы товар находился быстро и без ошибок.</>}
        how={<>Каждая единица товара проходит receiving → putaway → storage → picking → packing → dispatch. Скорость определяется слабейшим звеном.</>}
        why={
          <>
            Склад — это buffer между непредсказуемым спросом и предсказуемым производством/закупкой. Плохая
            организация складских процессов увеличивает не только расходы, но и время реакции на изменение спроса.
          </>
        }
        decision={
          <>
            Руководитель логистики измеряет не «средний» показатель склада, а показатель в пиковые дни — именно тогда
            узкое место проявляется и стоит компании упущенных продаж.
          </>
        }
      />

      <ChallengeBlock
        task={
          <>
            У вашего склада throughput 800 заказов/день при 6 сотрудниках на сборке. В пиковый день пришло 1400
            заказов. Опишите, какие 2 метрики вы бы посмотрели в первую очередь, чтобы понять, где узкое место —
            в picking, packing или dispatch.
          </>
        }
        hint="Сравните время, затрачиваемое на каждый этап на единицу заказа, а не общее количество сотрудников на этапе — узкое место не всегда там, где меньше всего людей."
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m06", score, total)} />
    </ModulePage>
  );
}
