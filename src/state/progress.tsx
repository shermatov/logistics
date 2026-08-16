import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { fetchProgress, saveProgress } from "../lib/api";

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

export type SyncStatus = "local-only" | "loading" | "synced" | "error";

interface ProgressApi extends ProgressState {
  markCompleted: (moduleId: string) => void;
  recordQuiz: (moduleId: string, score: number, total: number) => void;
  recordDecision: (score: number) => void;
  completionPct: (totalModules: number) => number;
  averageQuizPct: () => number;
  reset: () => void;
  syncStatus: SyncStatus;
}

const STORAGE_KEY = "logistics-school-progress-v1";
const EMPTY_PROGRESS: ProgressState = { completedModules: {}, quizResults: {}, decisionScores: [] };
const ProgressContext = createContext<ProgressApi | null>(null);

function loadLocal(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return { ...EMPTY_PROGRESS };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<ProgressState>(loadLocal);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local-only");
  const remoteLoadedRef = useRef(false);
  const prevTokenRef = useRef<string | null>(null);

  // Anonymous (logged-out) persistence — only source of truth when not authenticated.
  useEffect(() => {
    if (!token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, token]);

  // On login (or reload while already logged in), the server is authoritative:
  // fetch it and replace local state before any push is allowed to fire, so a
  // stale/anonymous state never overwrites real synced progress.
  useEffect(() => {
    if (!token) {
      if (prevTokenRef.current) {
        // just logged out — fall back to whatever's anonymous-local
        setState(loadLocal());
      }
      prevTokenRef.current = null;
      remoteLoadedRef.current = false;
      setSyncStatus("local-only");
      return;
    }
    prevTokenRef.current = token;
    let cancelled = false;
    remoteLoadedRef.current = false;
    setSyncStatus("loading");
    fetchProgress(token)
      .then((remote) => {
        if (cancelled) return;
        setState(remote);
        remoteLoadedRef.current = true;
        setSyncStatus("synced");
      })
      .catch(() => {
        if (cancelled) return;
        // Couldn't reach the server — keep local state, but still allow pushes
        // so it self-heals once connectivity returns.
        remoteLoadedRef.current = true;
        setSyncStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Push every change to the server once the initial remote load has landed.
  useEffect(() => {
    if (!token || !remoteLoadedRef.current) return;
    saveProgress(state, token)
      .then(() => setSyncStatus("synced"))
      .catch(() => setSyncStatus("error"));
  }, [state, token]);

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

  const reset = useCallback(() => setState({ ...EMPTY_PROGRESS }), []);

  const value = useMemo<ProgressApi>(
    () => ({ ...state, markCompleted, recordQuiz, recordDecision, completionPct, averageQuizPct, reset, syncStatus }),
    [state, markCompleted, recordQuiz, recordDecision, completionPct, averageQuizPct, reset, syncStatus]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
