import { NavLink } from "react-router-dom";
import { groups, moduleMeta } from "../../data/moduleMeta";
import { useProgress } from "../../state/progress";

function NavItem({ to, label, badge }: { to: string; label: string; badge?: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          isActive ? "font-semibold" : ""
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? "var(--surface-2)" : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
      })}
    >
      <span className="truncate">{label}</span>
      {badge && (
        <span className="text-xs" style={{ color: "var(--status-good)" }}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { completedModules } = useProgress();

  return (
    <aside
      className="w-64 shrink-0 h-full overflow-y-auto border-r px-3 py-4 flex flex-col gap-5"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="px-2">
        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          Logistics School
        </div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Wildberries · Upsell
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" label="Карта компетенций" />
        <NavItem to="/dashboard" label="Дашборд руководителя" />
        <NavItem to="/manager-mode" label="Manager Mode" />
        <NavItem to="/capstone" label="Capstone: 30 дней" />
      </nav>

      {groups.map((group) => {
        const items = moduleMeta.filter((m) => m.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-0.5">
            <div className="px-3 text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
              {group}
            </div>
            {items.map((m) => (
              <NavItem
                key={m.id}
                to={m.path}
                label={`${m.number}. ${m.shortTitle}`}
                badge={completedModules[m.id] ? "✓" : undefined}
              />
            ))}
          </div>
        );
      })}
    </aside>
  );
}
