import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, X } from "lucide-react";
import { groups, moduleMeta } from "../../data/moduleMeta";
import { groupStyle, topNavIcons } from "../../data/groupIcons";
import { useProgress } from "../../state/progress";

function NavItem({
  to,
  label,
  icon: Icon,
  done,
  accent,
  onNavigate,
}: {
  to: string;
  label: string;
  icon?: LucideIcon;
  done?: boolean;
  accent?: string;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150"
      style={({ isActive }) => ({
        background: isActive ? "var(--surface-2)" : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        fontWeight: isActive ? 600 : 500,
        boxShadow: isActive ? "var(--shadow-xs)" : "none",
      })}
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <span
              className="shrink-0 grid place-items-center w-6 h-6 rounded-lg transition-transform duration-150 group-hover:scale-105"
              style={{
                color: isActive ? (accent ?? "var(--series-1)") : "var(--text-muted)",
                background: isActive ? `color-mix(in srgb, ${accent ?? "var(--series-1)"} 14%, transparent)` : "transparent",
              }}
            >
              <Icon size={15} strokeWidth={2.2} />
            </span>
          )}
          <span className="truncate flex-1">{label}</span>
          {done && (
            <span style={{ color: "var(--status-good)" }}>
              <CheckCircle2 size={14} strokeWidth={2.4} />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const { completedModules } = useProgress();

  return (
    <div className="h-full w-64 overflow-y-auto px-3 py-4 flex flex-col gap-5" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center gap-2.5 px-2 pb-1">
        <div
          className="w-9 h-9 rounded-xl shrink-0 grid place-items-center text-white font-bold text-sm shadow-sm"
          style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-sm)" }}
        >
          L
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            Logistics School
          </div>
          <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            Wildberries · Upsell
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden shrink-0 w-8 h-8 rounded-lg grid place-items-center"
            style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}
            aria-label="Закрыть меню"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" label="Карта компетенций" icon={topNavIcons.home} accent="var(--series-1)" onNavigate={onNavigate} />
        <NavItem to="/dashboard" label="Дашборд руководителя" icon={topNavIcons.dashboard} accent="var(--series-3)" onNavigate={onNavigate} />
        <NavItem to="/manager-mode" label="Manager Mode" icon={topNavIcons.manager} accent="var(--series-2)" onNavigate={onNavigate} />
        <NavItem to="/capstone" label="Capstone: 30 дней" icon={topNavIcons.capstone} accent="var(--series-4)" onNavigate={onNavigate} />
        <NavItem to="/roadmap" label="Данные и Roadmap" icon={topNavIcons.roadmap} accent="var(--series-7)" onNavigate={onNavigate} />
        <NavItem to="/admin" label="Admin" icon={topNavIcons.admin} accent="var(--series-5)" onNavigate={onNavigate} />
        <NavItem to="/account" label="Аккаунт" icon={topNavIcons.account} accent="var(--series-1)" onNavigate={onNavigate} />
      </nav>

      {groups.map((group) => {
        const items = moduleMeta.filter((m) => m.group === group);
        if (items.length === 0) return null;
        const style = groupStyle[group];
        return (
          <div key={group} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 px-3 mb-1">
              {style && <style.icon size={12} strokeWidth={2.4} style={{ color: style.color }} />}
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {group}
              </div>
            </div>
            {items.map((m) => (
              <NavItem
                key={m.id}
                to={m.path}
                label={`${m.number}. ${m.shortTitle}`}
                done={!!completedModules[m.id]}
                accent={style?.color}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
