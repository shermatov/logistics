import { useState } from "react";
import { Card, CardTitle } from "../components/ui/Card";
import { Pill } from "../components/ui/Misc";
import { useProgress } from "../state/progress";

interface Scenario {
  id: string;
  title: string;
  situation: string[];
  question: string;
  strong: string[];
  senior: string;
}

const scenarios: Scenario[] = [
  {
    id: "s1",
    title: "Рост продаж + перегрузка одного склада",
    situation: [
      "Продажи выросли на 40% за месяц.",
      "Один склад (Москва) загружен на 95% ёмкости.",
      "Склад в Казани: days of stock = 14 дней при стабильном спросе.",
      "Return rate вырос на 5 п.п. за тот же период.",
      "FBS processing time вырос с 18 до 30 часов.",
    ],
    question: "Вы — руководитель логистики. Что вы делаете в первую очередь и в каком порядке?",
    strong: [
      "Разделяет проблему на срочное (перегрузка Москвы, риск отказа в приёмке) и системное (рост return rate, замедление FBS)",
      "Предлагает конкретное действие с числом: сколько единиц и куда перебросить",
      "Не игнорирует рост return rate как 'неважный' на фоне роста продаж",
    ],
    senior: "Приоритет №1 — перегрузка склада в Москве: это может остановить приёмку новых поставок уже на этой неделе, значит нужно немедленно перераспределить часть стока на Казань, у которой есть запас по ёмкости. Приоритет №2 — FBS processing time: рост с 18 до 30 часов — это операционный сигнал (нехватка персонала на пике или проблема в процессе), нужно смотреть на уровень конкретного этапа (Модуль 06/11), а не решать 'в среднем'. Рост return rate на фоне роста продаж — рассматриваем отдельно: возможно, выросла доля новых клиентов с более высоким процентом отказов, это нормально в моменте роста, но требует мониторинга, а не немедленного действия.",
  },
  {
    id: "s2",
    title: "Изменение тарифов логистики",
    situation: [
      "WB объявил рост логистического коэффициента для категории 'Обувь' на 25%.",
      "У вас 8 SKU в этой категории, суммарно 22% выручки.",
      "Средняя маржа по категории — 24%.",
      "Часть SKU уже на грани по contribution margin.",
    ],
    question: "Как вы отреагируете на изменение тарифа? Что пересчитаете в первую очередь?",
    strong: [
      "Сначала пересчитывает unit economics по каждому SKU индивидуально, а не по категории в среднем",
      "Разделяет SKU на 'выдержат рост' и 'уйдут в минус' — и предлагает разные действия для каждой группы",
      "Рассматривает не только повышение цены, но и изменение упаковки/модели фулфилмента",
    ],
    senior: "Первый шаг — пересчитать contribution margin по каждому из 8 SKU с новым коэффициентом (Модуль 04), а не полагаться на среднюю маржу 24% — она маскирует SKU, которые уже были на грани. Для SKU, уходящих в минус: рассмотреть три рычага — повышение цены (если рынок позволит), снижение объёма упаковки (Модуль 05, может вернуть в более дешёвый тарифный диапазон), или пересмотр модели FBS/FBW, если расчёт покажет разницу в итоговой логистической стоимости. Действовать нужно за 1-2 недели до вступления тарифа в силу, а не после.",
  },
];

export function ManagerModePage() {
  const { recordDecision } = useProgress();
  const [active, setActive] = useState<Scenario>(scenarios[0]);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [selfScore, setSelfScore] = useState<number | null>(null);

  function selectScenario(s: Scenario) {
    setActive(s);
    setAnswer("");
    setRevealed(false);
    setSelfScore(null);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--series-2)" }}>
          Manager Mode
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Реальный режим руководителя
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Здесь вы не читаете теорию, а сразу получаете ситуацию и отвечаете на вопрос «What would you do?». После
          ответа — сравнение с сильными сторонами хорошего решения и вариантом senior-руководителя.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => selectScenario(s)}
            className="text-sm rounded-lg px-3 py-1.5 border"
            style={{
              background: active.id === s.id ? "var(--series-1)" : "transparent",
              color: active.id === s.id ? "white" : "var(--text-primary)",
              borderColor: active.id === s.id ? "var(--series-1)" : "var(--border)",
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>Ситуация</CardTitle>
        <ul className="text-sm flex flex-col gap-1.5 mb-4" style={{ color: "var(--text-primary)" }}>
          {active.situation.map((s, i) => (
            <li key={i}>— {s}</li>
          ))}
        </ul>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          {active.question}
        </div>
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm min-h-32 outline-none"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          placeholder="Опишите порядок действий..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={answer.trim().length === 0}
          className="mt-3 text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-40"
          style={{ background: "var(--series-2)", color: "white" }}
        >
          Оценить решение
        </button>
      </Card>

      {revealed && (
        <>
          <Card>
            <CardTitle>Сильные стороны хорошего решения (проверьте себя)</CardTitle>
            <ul className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text-secondary)" }}>
              {active.strong.map((s, i) => (
                <li key={i}>✓ {s}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Решение senior-руководителя логистики</CardTitle>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {active.senior}
            </p>
          </Card>
          <Card>
            <CardTitle>Самооценка</CardTitle>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              Сравните своё решение с чек-листом и ответом senior-руководителя. Насколько близко было ваше решение?
            </p>
            <div className="flex gap-2 flex-wrap">
              {[20, 40, 60, 80, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSelfScore(v);
                    recordDecision(v);
                  }}
                  className="text-sm rounded-lg px-3 py-1.5 border"
                  style={{
                    background: selfScore === v ? "var(--status-good)" : "transparent",
                    color: selfScore === v ? "white" : "var(--text-primary)",
                    borderColor: selfScore === v ? "var(--status-good)" : "var(--border)",
                  }}
                >
                  {v}%
                </button>
              ))}
            </div>
            {selfScore !== null && (
              <div className="mt-3">
                <Pill tone="green">Оценка сохранена</Pill>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
