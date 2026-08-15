// One-off seed script. Mirrors the generation logic that used to live only in
// the frontend's src/data/sampleData.ts and src/data/tariffs.ts, so the
// database starts out matching what was already shipped as static/fallback
// data. Safe to re-run — uses upserts.
import { pool } from "./db.js";

const regions = ["Москва", "Центр", "СПб", "Поволжье", "Урал", "Сибирь"] as const;
const nationalDemandShares: Record<string, number> = {
  Москва: 0.4,
  Центр: 0.25,
  СПб: 0.1,
  Поволжье: 0.1,
  Урал: 0.08,
  Сибирь: 0.07,
};

const warehouses = [
  { warehouse_id: "KG-BSH", name: "Бишкек — консолидационный склад", region: "Бишкек", country: "KG", role: "consolidation", capacity_units: 40000, current_stock_units: 18500, logistics_coefficient: 1, storage_cost_per_unit_day: 0.05, demand_share: 0 },
  { warehouse_id: "RU-MSK", name: "Москва / Подмосковье — FBW WB склад", region: "Москва", country: "RU", role: "wb_sc", capacity_units: 30000, current_stock_units: 12400, logistics_coefficient: 1, storage_cost_per_unit_day: 0.18, demand_share: 0.55 },
  { warehouse_id: "RU-KAZ", name: "Казань — региональный fulfillment", region: "Поволжье", country: "RU", role: "fulfillment", capacity_units: 12000, current_stock_units: 3100, logistics_coefficient: 1.05, storage_cost_per_unit_day: 0.14, demand_share: 0.12 },
  { warehouse_id: "RU-EKB", name: "Екатеринбург — региональный fulfillment", region: "Урал", country: "RU", role: "fulfillment", capacity_units: 10000, current_stock_units: 2600, logistics_coefficient: 1.1, storage_cost_per_unit_day: 0.13, demand_share: 0.1 },
  { warehouse_id: "RU-NSK", name: "Новосибирск — региональный fulfillment", region: "Сибирь", country: "RU", role: "fulfillment", capacity_units: 8000, current_stock_units: 1400, logistics_coefficient: 1.2, storage_cost_per_unit_day: 0.12, demand_share: 0.13 },
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

function buildSkus() {
  return Array.from({ length: 24 }, (_, i) => {
    const cat = categories[i % categories.length];
    const cost = Math.round(between(350, 2200));
    const price = Math.round(cost / (1 - cat.marginPct - 0.19));
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
}

function isoDaysAgo(n: number): string {
  const d = new Date("2026-08-15T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildDailyMetrics() {
  return Array.from({ length: 30 }, (_, idx) => {
    const daysAgo = 29 - idx;
    const trend = 1 + (idx / 29) * 0.22;
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
}

const wbTariffs = {
  as_of_date: "2026-08-15",
  is_assumption: true,
  source_note:
    "Illustrative model values for training purposes only. Replace with the current tariff table from the official Wildberries seller portal before using in real planning.",
  volume_brackets: [
    { max_liters: 1, label: "До 1 л", coefficient: 1.0 },
    { max_liters: 5, label: "1–5 л", coefficient: 1.4 },
    { max_liters: 10, label: "5–10 л", coefficient: 1.9 },
    { max_liters: 20, label: "10–20 л", coefficient: 2.6 },
    { max_liters: null, label: "Свыше 20 л", coefficient: 3.5 },
  ],
  logistics_base_rub: 45,
  logistics_per_liter_rub: 10,
  storage_free_days: 60,
  storage_per_unit_day_rub: 0.15,
  commission_rate: 0.19,
  return_logistics_rub: 55,
  acceptance_coefficient_default: 1.0,
};

const cargoTariffs = {
  as_of_date: "2026-08-15",
  is_assumption: true,
  source_note: "Illustrative model values for training purposes only. Replace with your carrier/broker's current rate sheet.",
  modes: {
    consolidated_lcl: { cost_per_kg_rub: 45, cost_per_m3_rub: 5200, min_days: 6, max_days: 10 },
    partial_truck: { cost_per_kg_rub: 35, cost_per_m3_rub: 4200, min_days: 5, max_days: 8 },
    dedicated_truck: { cost_per_kg_rub: 22, cost_per_m3_rub: 2600, min_days: 4, max_days: 6 },
    railway: { cost_per_kg_rub: 18, cost_per_m3_rub: 2100, min_days: 10, max_days: 16 },
    "3pl": { cost_per_kg_rub: 40, cost_per_m3_rub: 4800, min_days: 6, max_days: 9 },
  },
  customs_and_documentation_per_shipment_rub: 18000,
  broker_fee_per_shipment_rub: 9000,
  border_days_min: 1,
  border_days_max: 4,
  loss_and_damage_rate: 0.006,
  truck_capacity_m3: 82,
  truck_capacity_kg: 20000,
};

async function main() {
  const skus = buildSkus();
  const dailyMetrics = buildDailyMetrics();

  for (const s of skus) {
    await pool.query(
      `INSERT INTO skus (sku_id, product_name, category, selling_price, product_cost, package_length_cm, package_width_cm, package_height_cm, package_weight_kg, return_rate, sales_velocity, fulfillment_model, demand_geography)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (sku_id) DO UPDATE SET product_name=$2, category=$3, selling_price=$4, product_cost=$5, package_length_cm=$6, package_width_cm=$7, package_height_cm=$8, package_weight_kg=$9, return_rate=$10, sales_velocity=$11, fulfillment_model=$12, demand_geography=$13, updated_at=now()`,
      [s.sku_id, s.product_name, s.category, s.selling_price, s.product_cost, s.package_length_cm, s.package_width_cm, s.package_height_cm, s.package_weight_kg, s.return_rate, s.sales_velocity, s.fulfillment_model, JSON.stringify(s.demand_geography)]
    );
  }
  console.log(`Seeded ${skus.length} SKUs`);

  for (const w of warehouses) {
    await pool.query(
      `INSERT INTO warehouses (warehouse_id, name, region, country, role, capacity_units, current_stock_units, logistics_coefficient, storage_cost_per_unit_day, demand_share)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (warehouse_id) DO UPDATE SET name=$2, region=$3, country=$4, role=$5, capacity_units=$6, current_stock_units=$7, logistics_coefficient=$8, storage_cost_per_unit_day=$9, demand_share=$10, updated_at=now()`,
      [w.warehouse_id, w.name, w.region, w.country, w.role, w.capacity_units, w.current_stock_units, w.logistics_coefficient, w.storage_cost_per_unit_day, w.demand_share]
    );
  }
  console.log(`Seeded ${warehouses.length} warehouses`);

  await pool.query(
    `INSERT INTO tariff_configs (key, data) VALUES ('wb', $1), ('cargo', $2)
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(wbTariffs), JSON.stringify(cargoTariffs)]
  );
  console.log("Seeded tariff configs");

  for (const d of dailyMetrics) {
    await pool.query(
      `INSERT INTO daily_metrics (date, orders, revenue, logistics_cost, returns, return_cost, stock_kg, stock_ru)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (date) DO UPDATE SET orders=$2, revenue=$3, logistics_cost=$4, returns=$5, return_cost=$6, stock_kg=$7, stock_ru=$8`,
      [d.date, d.orders, d.revenue, d.logisticsCost, d.returns, d.returnCost, d.stockKg, d.stockRu]
    );
  }
  console.log(`Seeded ${dailyMetrics.length} daily metrics`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
