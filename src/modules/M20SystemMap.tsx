import { Link } from "react-router-dom";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";

const managementQuestions: { q: string; module: string }[] = [
  { q: "Почему логистические расходы выросли?", module: "/modules/m04" },
  { q: "Какой склад должен получить следующую поставку?", module: "/modules/m08" },
  { q: "Почему этот SKU должен быть FBS, а не FBW?", module: "/modules/m14" },
  { q: "Сколько запаса нам стоит держать?", module: "/modules/m07" },
  { q: "Когда нужно пополнение?", module: "/modules/m07" },
  { q: "Почему возвраты бьют по прибыли?", module: "/modules/m10" },
  { q: "Где узкое место в нашей логистике?", module: "/modules/m11" },
  { q: "Что если этот склад станет недоступен?", module: "/modules/m18" },
  { q: "Сколько реально стоит доставить одну успешную продажу?", module: "/modules/m04" },
  { q: "Действительно ли более дешёвая логистика дешевле?", module: "/modules/cargo" },
  { q: "Где мы теряем деньги в цепочке поставок?", module: "/modules/cargo" },
  { q: "Что нужно изменить на следующей неделе?", module: "/dashboard" },
];

const quizQuestions = [
  {
    question: "Почему в модели логистики важно одновременно отслеживать Product, Information, Money и Risk, а не только физическое движение товара?",
    options: [
      "Потому что это модно в консалтинге",
      "Потому что решение, основанное только на движении товара, упускает, где теряются данные, деньги или накапливается риск — то есть где реально принимаются неверные решения",
      "Information и Money не связаны с логистикой",
      "Risk flow важен только для крупных компаний",
    ],
    correctIndex: 1,
    explanation: "Товар может физически двигаться правильно, но если данные о нём не синхронизированы (Information) или деньги заморожены дольше, чем нужно (Money), или риск не отслеживается (Risk) — система всё равно теряет эффективность.",
  },
];

export function M20SystemMap() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m20"
      number="20"
      title="Logistics Management System — система управления логистикой"
      level="Architect"
      intro="Здесь всё сходится в одну систему: 20 модулей курса и cargo-цепочка Кыргызстан → Россия — это не отдельные темы, а один операционный организм."
    >
      <section>
        <SectionHeading eyebrow="System" title="Inputs → Process → Outputs" />
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--series-1)" }}>Inputs</div>
              <FlowDiagram
                steps={[
                  { title: "Demand", tone: "blue" },
                  { title: "Inventory", tone: "blue" },
                  { title: "Orders", tone: "blue" },
                  { title: "Returns", tone: "blue" },
                  { title: "Capacity", tone: "blue" },
                  { title: "Tariffs", tone: "blue" },
                  { title: "Transport", tone: "blue" },
                  { title: "Costs", tone: "blue" },
                ]}
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--series-3)" }}>Process</div>
              <FlowDiagram
                steps={[
                  { title: "Planning", tone: "aqua" },
                  { title: "Allocation", tone: "aqua" },
                  { title: "Fulfillment", tone: "aqua" },
                  { title: "Transportation", tone: "aqua" },
                  { title: "Monitoring", tone: "aqua" },
                  { title: "Optimization", tone: "aqua" },
                ]}
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--series-2)" }}>Outputs</div>
              <FlowDiagram
                steps={[
                  { title: "Delivery", tone: "orange" },
                  { title: "Availability", tone: "orange" },
                  { title: "Cost", tone: "orange" },
                  { title: "Customer Experience", tone: "orange" },
                  { title: "Profit", tone: "orange" },
                ]}
              />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Four flows" title="Product + Information + Money + Risk" subtitle="Логистика — это не только движение коробок." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card><CardTitle>Product flow</CardTitle><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Физическое движение товара: поставщик → склад → клиент → возврат.</p></Card>
          <Card><CardTitle>Information flow</CardTitle><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Остатки, статусы заказов, прогноз спроса — данные, без которых решения принимаются вслепую.</p></Card>
          <Card><CardTitle>Money flow</CardTitle><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Капитал, замороженный в товаре, себестоимость, маржа на каждом этапе.</p></Card>
          <Card><CardTitle>Risk flow</CardTitle><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Вероятность и последствия срыва на каждом звене — от таможни до возврата.</p></Card>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Final objective" title="Вопросы, на которые вы теперь можете ответить" />
        <Card padded={false}>
          <div className="divide-y" style={{ borderColor: "var(--gridline)" }}>
            {managementQuestions.map((mq) => (
              <Link
                key={mq.q}
                to={mq.module}
                className="flex items-center justify-between px-4 py-3 text-sm hover:opacity-80"
                style={{ borderColor: "var(--gridline)" }}
              >
                <span style={{ color: "var(--text-primary)" }}>{mq.q}</span>
                <span style={{ color: "var(--series-1)" }}>→</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Итоговая цель курса</CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Цель — не «я знаю логистику», а «я могу управлять логистической системой и объяснить, почему каждое важное
          логистическое решение имеет экономический и операционный смысл» — от поставщика в Кыргызстане до клиента на
          Wildberries и обратно.
        </p>
      </Card>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m20", score, total)} />
    </ModulePage>
  );
}
