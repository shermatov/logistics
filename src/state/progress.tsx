import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface QuizResult {
  score: number;
  total: number;
  at: string;
}

interface ProgressState {
  completedModules: Record<string, boolean>;
  quizResults: Record<string, QuizResult>;
  decisionScores: number[]; // manager-mode / case decision self-assessed scores 0-100
}

interface ProgressApi extends ProgressState {
  markCompleted: (moduleId: string) => void;
  recordQuiz: (moduleId: string, score: number, total: number) => void;
  recordDecision: (score: number) => void;
  completionPct: (totalModules: number) => number;
  averageQuizPct: () => number;
  reset: () => void;
}

const STORAGE_KEY = "logistics-school-progress-v1";
const ProgressContext = createContext<ProgressApi | null>(null);

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return { completedModules: {}, quizResults: {}, decisionScores: [] };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const markCompleted = useCallback((moduleId: string) => {
    setState((s) => ({ ...s, completedModules: { ...s.completedModules, [moduleId]: true } }));
  }, []);

  const recordQuiz = useCallback((moduleId: string, score: number, total: number) => {
    setState((s) => ({
      ...s,
      quizResults: { ...s.quizResults, [moduleId]: { score, total, at: new Date().toISOString() } },
    }));
  }, []);

  const recordDecision = useCallback((score: number) => {
    setState((s) => ({ ...s, decisionScores: [...s.decisionScores, score].slice(-50) }));
  }, []);

  const completionPct = useCallback(
    (totalModules: number) => (totalModules === 0 ? 0 : Object.keys(state.completedModules).length / totalModules),
    [state.completedModules]
  );

  const averageQuizPct = useCallback(() => {
    const results = Object.values(state.quizResults);
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score / r.total, 0);
    return sum / results.length;
  }, [state.quizResults]);

  const reset = useCallback(() => setState({ completedModules: {}, quizResults: {}, decisionScores: [] }), []);

  const value = useMemo<ProgressApi>(
    () => ({ ...state, markCompleted, recordQuiz, recordDecision, completionPct, averageQuizPct, reset }),
    [state, markCompleted, recordQuiz, recordDecision, completionPct, averageQuizPct, reset]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
