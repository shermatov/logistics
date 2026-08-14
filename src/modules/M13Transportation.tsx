import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { useProgress } from "../state/progress";

const modes: { name: string; fixed: string; variable: string; when: string }[] = [
  { name: "Full Truckload (FTL)", fixed: "Высокие — платите за всю машину целиком", variable: "Низкие на единицу при полной загрузке", when: "Большой стабильный объём между двумя точками" },
  { name: "Less-than-Truckload (LTL)", fixed: "Ниже — платите долю от машины", variable: "Выше на единицу, чем FTL", when: "Средний объём, не хватает на полную машину" },
  { name: "Курьер / малый транспорт", fixed: "Минимальные", variable: "Самые высокие на единицу", when: "Срочные малые партии, last mile" },
  { name: "3PL-оператор", fixed: "Практически нет (переменная модель)", variable: "Средние-высокие, но включают ответственность за груз", when: "Нужна перевозка 'под ключ' без своей логистической команды" },
];

const quizQuestions = [
  {
    question: "Почему FTL становится выгоднее LTL только при достаточном объёме?",
    options: [
      "FTL всегда дороже, независимо от объёма",
      "У FTL высокие фиксированные расходы, которые делятся на весь объём — при малом объёме это дороже на единицу, чем LTL",
      "LTL быстрее FTL при любом объёме",
      "Объём не влияет на выбор между FTL и LTL",
    ],
    correctIndex: 1,
    explanation: "Это тот же принцип 'фиксированные расходы делятся на объём', что и в Cargo-модуле (Модуль 21) — просто применённый к внутренней транспортировке.",
  },
];

export function M13Transportation() {
  const { recordQuiz } = useProgress();
  return (
    <ModulePage
      moduleId="m13"
      number="13"
      title="Transportation Management — транспортная логистика"
      level="Manager"
      intro="Внутри страны действуют те же принципы, что и в cargo-логистике между Кыргызстаном и Россией (Модуль 21): фиксированные vs переменные расходы, utilization, выбор способа перевозки под объём и срочность."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Где возникает транспортировка внутри системы" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Supplier → Warehouse", subtitle: "Входящая поставка", tone: "blue" },
              { title: "Warehouse → WB", subtitle: "Отгрузка на приёмку WB", tone: "aqua" },
              { title: "Inter-warehouse", subtitle: "Перемещение между складами", tone: "aqua" },
              { title: "Return transport", subtitle: "Обратная логистика", tone: "red" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="Способы перевозки" />
        <Card padded={false}>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Способ</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Фиксированные расходы</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Переменные расходы</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Когда выгодно</th>
                </tr>
              </thead>
              <tbody>
                {modes.map((m, i) => (
                  <tr key={m.name} style={{ borderBottom: i < modes.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{m.fixed}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{m.variable}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{m.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Метрики транспортировки <Pill tone="blue">единая логика с Cargo-модулем</Pill></CardTitle>
        <ul className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <li>— Cost per km, cost per kg, cost per m³, cost per shipment — те же формулы, что в Модуле 21, применённые к внутренней перевозке.</li>
          <li>— Utilization (загрузка транспорта) — используйте калькулятор загрузки машины из Модуля 21 напрямую для внутренних перевозок.</li>
          <li>— Fixed vs variable cost — определяет, при каком объёме переходить с LTL/курьера на FTL.</li>
        </ul>
      </Card>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m13", score, total)} />
    </ModulePage>
  );
}
