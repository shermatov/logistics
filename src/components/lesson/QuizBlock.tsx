import { useState } from "react";
import { Card, CardTitle } from "../ui/Card";
import clsx from "clsx";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function QuizBlock({
  title = "Проверь себя",
  questions,
  onComplete,
}: {
  title?: string;
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce<number>((acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0), 0);

  function submit() {
    setSubmitted(true);
    onComplete?.(score, questions.length);
  }

  return (
    <Card>
      <CardTitle>
        {title} ({questions.length} вопросов)
      </CardTitle>
      <div className="flex flex-col gap-5">
        {questions.map((q, qi) => (
          <div key={qi}>
            <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              {qi + 1}. {q.question}
            </div>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrongSelected = submitted && isSelected && oi !== q.correctIndex;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      })
                    }
                    className={clsx(
                      "text-left text-sm rounded-lg border px-3 py-2 transition-colors",
                      !submitted && "cursor-pointer hover:opacity-80"
                    )}
                    style={{
                      borderColor: isCorrect
                        ? "var(--status-good)"
                        : isWrongSelected
                        ? "var(--status-critical)"
                        : isSelected
                        ? "var(--series-1)"
                        : "var(--border)",
                      background: isSelected && !submitted ? "var(--surface-2)" : "transparent",
                      color: "var(--text-primary)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="text-xs mt-2 rounded-md px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={answers.some((a) => a === null)}
            className="text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-40"
            style={{ background: "var(--series-1)", color: "white" }}
          >
            Проверить ответы
          </button>
        ) : (
          <>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Результат: {score} / {questions.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setAnswers(Array(questions.length).fill(null));
              }}
              className="text-sm rounded-lg px-3 py-1.5 border"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Пройти ещё раз
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
