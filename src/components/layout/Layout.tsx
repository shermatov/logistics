import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { moduleMeta } from "../../data/moduleMeta";
import { useProgress } from "../../state/progress";
import { ProgressBar } from "../ui/Misc";

export function Layout() {
  const { completionPct } = useProgress();
  const pct = completionPct(moduleMeta.length);

  return (
    <div className="flex h-screen" style={{ background: "var(--surface-0)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 shrink-0 border-b px-6 flex items-center justify-between gap-4"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Владелец направления «Логистика» — программа подготовки
          </div>
          <div className="flex items-center gap-3 w-48">
            <div className="flex-1">
              <ProgressBar pct={pct} />
            </div>
            <span className="text-xs tabular shrink-0" style={{ color: "var(--text-secondary)" }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
