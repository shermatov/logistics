import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { moduleMeta } from "../../data/moduleMeta";
import { useProgress } from "../../state/progress";
import { ProgressRing } from "../ui/Misc";

export function Layout() {
  const { completionPct } = useProgress();
  const pct = completionPct(moduleMeta.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen" style={{ background: "var(--surface-0)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0 h-full border-r" style={{ borderColor: "var(--border)" }}>
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative h-full border-r shadow-[var(--shadow-lg)]" style={{ borderColor: "var(--border)" }}>
            <Sidebar onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 shrink-0 border-b px-4 sm:px-6 flex items-center justify-between gap-3 relative"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
          <div className="flex items-center gap-3 min-w-0 relative">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden shrink-0 w-8 h-8 rounded-lg grid place-items-center"
              style={{ color: "var(--text-primary)", background: "var(--surface-2)" }}
              aria-label="Открыть меню"
            >
              <Menu size={16} strokeWidth={2.4} />
            </button>
            <div className="text-sm font-medium truncate hidden sm:block" style={{ color: "var(--text-primary)" }}>
              Владелец направления «Логистика» — программа подготовки
            </div>
            <div className="text-sm font-bold truncate sm:hidden" style={{ color: "var(--text-primary)" }}>
              Logistics School
            </div>
          </div>
          <div className="flex items-center gap-2 relative shrink-0">
            <span className="text-xs hidden sm:inline" style={{ color: "var(--text-muted)" }}>
              Прогресс курса
            </span>
            <ProgressRing pct={pct} size={34} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
