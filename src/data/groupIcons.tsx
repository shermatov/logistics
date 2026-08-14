import {
  BookOpen,
  ShoppingBag,
  Calculator,
  Warehouse,
  Truck,
  Radar,
  Compass,
  Map,
  LayoutDashboard,
  UserCog,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const groupStyle: Record<string, { icon: LucideIcon; color: string }> = {
  "Основы": { icon: BookOpen, color: "var(--series-1)" },
  "Wildberries": { icon: ShoppingBag, color: "var(--series-2)" },
  "Экономика": { icon: Calculator, color: "var(--series-4)" },
  "Склад и запасы": { icon: Warehouse, color: "var(--series-3)" },
  "Cargo: Кыргызстан → Россия": { icon: Truck, color: "var(--series-7)" },
  "Управление": { icon: Radar, color: "var(--series-5)" },
  "Стратегия": { icon: Compass, color: "var(--series-8)" },
};

export const topNavIcons = {
  home: Map,
  dashboard: LayoutDashboard,
  manager: UserCog,
  capstone: Trophy,
};
