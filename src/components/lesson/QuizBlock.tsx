import { useState } from "react";
import { CheckCircle2, XCircle, Trophy, RotateCcw, HelpCircle } from "lucide-react";
import { Card } from "../ui/Card";
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
  const allCorrect = submitted && score === questions.length;

  function submit() {
    setSubmitted(true);
    onComplete?.(score, questions.length);
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--series-4) 16%, transparent)", color: "var(--series-4)" }}
        >
          <HelpCircle size={14} strokeWidth={2.4} />
        </span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title} ({questions.length} вопросов)
        </h3>
      </div>
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
                      "flex items-center justify-between gap-2 text-left text-sm rounded-xl border px-3.5 py-2.5 transition-all duration-150",
                      !submitted && "cursor-pointer hover:border-[var(--series-1)]"
                    )}
                    style={{
                      borderColor: isCorrect
                        ? "var(--status-good)"
                        : isWrongSelected
                        ? "var(--status-critical)"
                        : isSelected
                        ? "var(--series-1)"
                        : "var(--border)",
                      background: isCorrect
                        ? "color-mix(in srgb, var(--status-good) 10%, transparent)"
                        : isWrongSelected
                        ? "color-mix(in srgb, var(--status-critical) 10%, transparent)"
                        : isSelected && !submitted
                        ? "var(--surface-2)"
                        : "transparent",
                      color: "var(--text-primary)",
                    }}
                  >
                    {opt}
                    {isCorrect && <CheckCircle2 size={16} strokeWidth={2.4} style={{ color: "var(--status-good)" }} className="shrink-0" />}
                    {isWrongSelected && <XCircle size={16} strokeWidth={2.4} style={{ color: "var(--status-critical)" }} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div
                className="text-xs mt-2 rounded-lg px-3 py-2 border"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
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
            className="text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 disabled:opacity-40 transition-transform duration-150 hover:-translate-y-0.5"
            style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
          >
            Проверить ответы
          </button>
        ) : (
          <>
            <span
              className={clsx("pop-in inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full")}
              style={{
                color: allCorrect ? "var(--status-good)" : "var(--text-primary)",
                background: allCorrect ? "color-mix(in srgb, var(--status-good) 14%, transparent)" : "var(--surface-2)",
              }}
            >
              {allCorrect && <Trophy size={14} strokeWidth={2.4} />}
              Результат: {score} / {questions.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setAnswers(Array(questions.length).fill(null));
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium rounded-[var(--radius-pill)] px-3.5 py-1.5 border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <RotateCcw size={13} strokeWidth={2.4} />
              Пройти ещё раз
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
