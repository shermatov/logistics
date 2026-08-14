import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  padded = true,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-md)] border transition-all duration-200",
        padded && "p-5",
        interactive && "hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        if (interactive) e.currentTarget.style.boxShadow = "var(--shadow-xs)";
      }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={clsx("text-sm font-semibold mb-3", className)} style={{ color: "var(--text-primary)" }}>
      {children}
    </h3>
  );
}
