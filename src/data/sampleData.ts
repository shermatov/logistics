// Example company data: "Upsell" — a fictional seller shipping goods from
// Kyrgyzstan into Russia and selling on Wildberries via FBS + FBW.
// This is illustrative training data, not a real seller's figures.
import type { SKU, Warehouse } from "./types";

export const regions = ["Москва", "Центр", "СПб", "Поволжье", "Урал", "Сибирь"] as const;
export type Region = (typeof regions)[number];

export const nationalDemandShares: Record<Region, number> = {
  Москва: 0.4,
  Центр: 0.25,
  СПб: 0.1,
  Поволжье: 0.1,
  Урал: 0.08,
  Сибирь: 0.07,
};

export const warehouses: Warehouse[] = [
  {
    warehouse_id: "KG-BSH",
    name: "Бишкек — консолидационный склад",
    region: "Бишкек",
    country: "KG",
    role: "consolidation",
    capacity_units: 40000,
    current_stock_units: 18500,
    logistics_coefficient: 1,
    storage_cost_per_unit_day: 0.05,
    demand_share: 0,
  },
  {
    warehouse_id: "RU-MSK",
    name: "Москва / Подмосковье — FBW WB склад",
    region: "Москва",
    country: "RU",
    role: "wb_sc",
    capacity_units: 30000,
    current_stock_units: 12400,
    logistics_coefficient: 1,
    storage_cost_per_unit_day: 0.18,
    demand_share: 0.55,
  },
  {
    warehouse_id: "RU-KAZ",
    name: "Казань — региональный fulfillment",
    region: "Поволжье",
    country: "RU",
    role: "fulfillment",
    capacity_units: 12000,
    current_stock_units: 3100,
    logistics_coefficient: 1.05,
    storage_cost_per_unit_day: 0.14,
    demand_share: 0.12,
  },
  {
    warehouse_id: "RU-EKB",
    name: "Екатеринбург — региональный fulfillment",
    region: "Урал",
    country: "RU",
    role: "fulfillment",
    capacity_units: 10000,
    current_stock_units: 2600,
    logistics_coefficient: 1.1,
    storage_cost_per_unit_day: 0.13,
    demand_share: 0.1,
  },
  {
    warehouse_id: "RU-NSK",
    name: "Новосибирск — региональный fulfillment",
    region: "Сибирь",
    country: "RU",
    role: "fulfillment",
    capacity_units: 8000,
    current_stock_units: 1400,
    logistics_coefficient: 1.2,
    storage_cost_per_unit_day: 0.12,
    demand_share: 0.13,
  },
];

const categories = [
  { name: "Женская одежда", returnRate: 0.32, marginPct: 0.28 },
  { name: "Мужская одежда", returnRate: 0.22, marginPct: 0.3 },
  { name: "Обувь", returnRate: 0.35, marginPct: 0.25 },
  { name: "Аксессуары", returnRate: 0.12, marginPct: 0.4 },
  { name: "Товары для дома", returnRate: 0.08, marginPct: 0.35 },
  { name: "Косметика и уход", returnRate: 0.06, marginPct: 0.45 },
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260815);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

export const skus: SKU[] = Array.from({ length: 24 }, (_, i) => {
  const cat = categories[i % categories.length];
  const cost = Math.round(between(350, 2200));
  const price = Math.round(cost / (1 - cat.marginPct - 0.19)); // back into price incl. ~19% marketplace commission
  const velocity = Math.round(between(3, 60));
  const fulfillment = velocity > 20 || cat.returnRate < 0.15 ? "FBW" : velocity < 8 ? "FBS" : pick(["FBS", "FBW"] as const);

  const primary = pick(regions);
  const demand_geography: Record<string, number> = {};
  regions.forEach((r) => {
    demand_geography[r] = r === primary ? nationalDemandShares[r] * between(1.3, 1.7) : nationalDemandShares[r] * between(0.6, 1.1);
  });
  const sum = Object.values(demand_geography).reduce((a, b) => a + b, 0);
  regions.forEach((r) => (demand_geography[r] = demand_geography[r] / sum));

  return {
    sku_id: `SKU-${String(i + 1).padStart(3, "0")}`,
    product_name: `${cat.name} — артикул ${1000 + i}`,
    category: cat.name,
    selling_price: price,
    product_cost: cost,
    package_length_cm: Math.round(between(15, 45)),
    package_width_cm: Math.round(between(10, 35)),
    package_height_cm: Math.round(between(3, 20)),
    package_weight_kg: Math.round(between(0.15, 2.2) * 100) / 100,
    return_rate: Math.round(cat.returnRate * between(0.8, 1.3) * 100) / 100,
    sales_velocity: velocity,
    fulfillment_model: fulfillment,
    demand_geography,
  };
});

// ---- 30-day operating history for the dashboard ----
export interface DailyMetric {
  date: string;
  orders: number;
  revenue: number;
  logisticsCost: number;
  returns: number;
  returnCost: number;
  stockKg: number;
  stockRu: number;
}

function isoDaysAgo(n: number): string {
  const d = new Date("2026-08-15T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export const dailyHistory: DailyMetric[] = Array.from({ length: 30 }, (_, idx) => {
  const daysAgo = 29 - idx;
  const trend = 1 + (idx / 29) * 0.22; // gentle 22% growth over the period
  const weekday = new Date(isoDaysAgo(daysAgo)).getUTCDay();
  const weekendBoost = weekday === 0 || weekday === 6 ? 1.15 : 1;
  const noise = between(0.9, 1.1);

  const orders = Math.round(320 * trend * weekendBoost * noise);
  const avgPrice = 1450;
  const revenue = Math.round(orders * avgPrice * between(0.95, 1.05));
  const logisticsCost = Math.round(orders * between(140, 175));
  const returnRateDay = between(0.16, 0.24);
  const returns = Math.round(orders * returnRateDay);
  const returnCost = Math.round(returns * between(180, 260));
  const stockKg = Math.round(18500 - idx * 90 + between(-300, 300));
  const stockRu = Math.round(19500 + idx * 60 + between(-300, 300));

  return { date: isoDaysAgo(daysAgo), orders, revenue, logisticsCost, returns, returnCost, stockKg, stockRu };
});

export const returnReasonBreakdown = [
  { reason: "Размер не подошёл", share: 0.34 },
  { reason: "Не подошёл фасон / посадка", share: 0.18 },
  { reason: "Брак / качество", share: 0.14 },
  { reason: "Не соответствует ожиданиям", share: 0.16 },
  { reason: "Передумал(а)", share: 0.12 },
  { reason: "Повреждён при доставке", share: 0.06 },
];
