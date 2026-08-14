import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-xl border",
        padded && "p-5",
        className
      )}
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
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
