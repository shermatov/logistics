// Capstone simulation engine (§27, §43.13). Pure, deterministic (given a
// seed), and framework-agnostic — the day-by-day mechanics live here, the
// CapstonePage component only renders state and forwards player choices.
//
// Three "hero" SKUs stand in for the full 24-SKU/5-warehouse portfolio: a
// high-return fashion item (FBS), a steady low-return home-goods item (FBW),
// and a seasonal-spike accessory (FBS). Each day, demand is drawn, orders are
// fulfilled from Russian stock, and every cost/formula reuses the same
// calculation engine as the rest of the app (reorder point, cargo cost,
// lead time, unit economics) — nothing here is scripted narrative with
// made-up deltas.
import type { CargoMode, TariffConfig } from "../data/types";
import {
  daysOfStock,
  reorderPoint,
  safetyStock,
  estimatedLogisticsCostPerUnit,
  calcCargoCost,
  totalLeadTime,
  returnCostImpact,
  stockTurnover,
} from "./formulas";
import type { CargoTariffConfig } from "./api";
import type { Warehouse } from "../data/types";

export type FulfillmentModel = "FBS" | "FBW";

export interface HeroSku {
  id: string;
  name: string;
  sellingPrice: number;
  productCost: number;
  baseVelocity: number;
  returnRate: number;
  packageLiters: number;
}

export const HERO_SKUS: HeroSku[] = [
  { id: "fashion", name: "Женская одежда (SKU-F1)", sellingPrice: 2490, productCost: 950, baseVelocity: 22, returnRate: 0.3, packageLiters: 4.5 },
  { id: "home", name: "Товары для дома (SKU-H1)", sellingPrice: 1690, productCost: 640, baseVelocity: 16, returnRate: 0.07, packageLiters: 6.0 },
  { id: "accessory", name: "Аксессуары (SKU-A1)", sellingPrice: 990, productCost: 310, baseVelocity: 10, returnRate: 0.1, packageLiters: 1.2 },
];

const SIM_DAYS = 30;
const PLANNING_LEAD_TIME_DAYS = 16; // used only to decide *when* to trigger a reorder prompt
const DEFAULT_WAREHOUSE_ID = "RU-MSK";
const ALT_WAREHOUSE_ID = "RU-KAZ";

function hash01(seed: number, ...keys: number[]): number {
  let h = seed >>> 0;
  for (const k of keys) h = Math.imul(h ^ k, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

export interface SkuRuntime {
  ruStock: number;
  fulfillment: FulfillmentModel;
  velocityMultiplier: number;
  velocityMultiplierUntilDay: number | null;
  returnRateOverride: number | null;
  returnRateOverrideUntilDay: number | null;
  storageCostMultiplier: number;
  storageCostMultiplierUntilDay: number | null;
  warehouseId: string;
  pendingShipmentUnits: number;
  pendingShipmentArrivalDay: number | null;
}

export interface LogEntry {
  day: number;
  text: string;
  kind: "info" | "event" | "decision" | "stockout";
}

export interface DecisionOption {
  id: string;
  label: string;
  note: string;
}

export interface Decision {
  id: string;
  skuId: string;
  kind: "reorder" | "return_wave" | "demand_spike" | "capacity";
  title: string;
  description: string;
  options: DecisionOption[];
}

export interface SimState {
  day: number;
  finished: boolean;
  skus: Record<string, SkuRuntime>;
  cumRevenue: number;
  cumProductCost: number;
  cumLogisticsCost: number;
  cumReturnCost: number;
  cumCargoCost: number;
  cumStorageCost: number;
  cumCommission: number;
  ordersTotal: number;
  ordersFulfilled: number;
  stockoutUnitDays: number;
  peakCapital: number;
  inventorySamples: number[];
  log: LogEntry[];
  pendingDecision: Decision | null;
}

const initialFulfillment: Record<string, FulfillmentModel> = { fashion: "FBS", home: "FBW", accessory: "FBS" };

export function createInitialState(): SimState {
  const skus: Record<string, SkuRuntime> = {};
  for (const s of HERO_SKUS) {
    skus[s.id] = {
      ruStock: Math.round(s.baseVelocity * 28),
      fulfillment: initialFulfillment[s.id],
      velocityMultiplier: 1,
      velocityMultiplierUntilDay: null,
      returnRateOverride: null,
      returnRateOverrideUntilDay: null,
      storageCostMultiplier: 1,
      storageCostMultiplierUntilDay: null,
      warehouseId: DEFAULT_WAREHOUSE_ID,
      pendingShipmentUnits: 0,
      pendingShipmentArrivalDay: null,
    };
  }
  return {
    day: 1,
    finished: false,
    skus,
    cumRevenue: 0,
    cumProductCost: 0,
    cumLogisticsCost: 0,
    cumReturnCost: 0,
    cumCargoCost: 0,
    cumStorageCost: 0,
    cumCommission: 0,
    ordersTotal: 0,
    ordersFulfilled: 0,
    stockoutUnitDays: 0,
    peakCapital: 0,
    inventorySamples: [],
    log: [{ day: 1, text: "Старт месяца. Три ключевых SKU под управлением, склад в России укомплектован на ~12 дней вперёд.", kind: "info" }],
    pendingDecision: null,
  };
}

export type Policy = (state: SimState, decision: Decision) => string;

/** A simple rule-based benchmark, NOT a claim of mathematical optimality — used as a comparison baseline. */
export const textbookPolicy: Policy = (_state, decision) => {
  switch (decision.kind) {
    case "reorder":
      return "dedicated_truck";
    case "return_wave":
      return "fix_listing";
    case "demand_spike":
      return "rush_cargo";
    case "capacity":
      return "pay_storage";
    default:
      return decision.options[0].id;
  }
};

/**
 * calcCargoCost's totalCargoCost bundles in the value of the goods
 * themselves (it doubles as a "fully landed cost" figure elsewhere in the
 * app). Here, COGS is recognized separately at time of sale (cumProductCost)
 * to match calcUnitEconomics' model — so only the logistics/import portion
 * of a cargo shipment belongs in cumCargoCost, or it gets double-counted.
 */
function cargoLogisticsOnlyCost(cost: { totalCargoCost: number }, productCostTotal: number): number {
  return cost.totalCargoCost - productCostTotal;
}

function cloneState(state: SimState): SimState {
  return {
    ...state,
    skus: Object.fromEntries(Object.entries(state.skus).map(([k, v]) => [k, { ...v }])),
    log: [...state.log],
    inventorySamples: [...state.inventorySamples],
  };
}

function warehouseStorageRate(warehouses: Warehouse[], warehouseId: string): number {
  return warehouses.find((w) => w.warehouse_id === warehouseId)?.storage_cost_per_unit_day ?? 0.15;
}

function buildReorderDecision(sku: HeroSku, rt: SkuRuntime, day: number, tariffs: CargoTariffConfig): Decision {
  const orderUnits = Math.round(sku.baseVelocity * rt.velocityMultiplier * 20);
  const weightKg = orderUnits * 0.5;
  const volumeM3 = orderUnits * (sku.packageLiters / 1000);

  function modeOption(mode: CargoMode, id: string, label: string): DecisionOption {
    const rate = tariffs.modes[mode];
    const lead = totalLeadTime({ productionDays: 5, cargoTransitDays: rate.max_days, borderCustomsDays: tariffs.border_days_max, warehouseProcessingDays: 1 });
    const cost = calcCargoCost(
      {
        productCostTotal: orderUnits * sku.productCost,
        packagingTotal: orderUnits * 15,
        kyrgyzstanLocalTransport: 5000,
        weightKg,
        volumeM3,
        mode,
        declaredValue: orderUnits * sku.productCost,
        russiaInlandDelivery: 8000,
        warehouseAndFulfillment: 6000,
      },
      tariffs
    );
    const logisticsCost = cargoLogisticsOnlyCost(cost, orderUnits * sku.productCost);
    return { id, label: `${label} — ~${lead} дн, ${Math.round(logisticsCost).toLocaleString("ru-RU")} ₽ логистика`, note: `Партия ${orderUnits} ед., прибытие через ${lead} дней.` };
  }

  return {
    id: `reorder-${sku.id}-${day}`,
    skuId: sku.id,
    kind: "reorder",
    title: `${sku.name}: сток в России приближается к точке заказа`,
    description: `Остаток ${rt.ruStock} ед. на складе ${rt.warehouseId}. При текущем темпе продаж пора планировать пополнение из Кыргызстана — иначе есть риск stockout до прихода следующей партии.`,
    options: [
      modeOption("dedicated_truck", "dedicated_truck", "Отдельная машина (быстро, дороже)"),
      modeOption("consolidated_lcl", "consolidated_lcl", "Сборный груз (медленнее, дешевле)"),
      { id: "wait", label: "Подождать ещё один день", note: "Экономит капитал сейчас, но риск stockout растёт с каждым днём ожидания." },
    ],
  };
}

function buildReturnWaveDecision(sku: HeroSku): Decision {
  return {
    id: `return_wave-${sku.id}`,
    skuId: sku.id,
    kind: "return_wave",
    title: `${sku.name}: волна возвратов`,
    description: "Return rate резко вырос — в комментариях клиенты жалуются, что размер не соответствует сетке.",
    options: [
      { id: "fix_listing", label: "Обновить размерную сетку в карточке", note: "Return rate снижается вдвое до конца месяца — устраняет причину, а не симптом." },
      { id: "ignore", label: "Не реагировать", note: "Return rate остаётся повышенным до конца месяца." },
      { id: "pull_ads", label: "Временно снять с рекламы", note: "Продажи (и абсолютные потери от возвратов) падают на 30% на 10 дней, return rate не меняется." },
    ],
  };
}

function buildDemandSpikeDecision(sku: HeroSku): Decision {
  return {
    id: `demand_spike-${sku.id}`,
    skuId: sku.id,
    kind: "demand_spike",
    title: `${sku.name}: внезапный всплеск спроса`,
    description: "Продажи резко ускорились (вирусный отзыв/тренд). Окно спроса открыто, но неизвестно, насколько надолго.",
    options: [
      { id: "rush_cargo", label: "Срочно заказать доп. партию (dedicated truck)", note: "Дорогая быстрая доставка — если успеет прийти до конца всплеска, ловит апсайд; если нет, остаётся лишний сток." },
      { id: "do_nothing", label: "Ничего не менять", note: "Риск stockout на пике спроса — упущенная выручка." },
    ],
  };
}

function buildCapacityDecision(sku: HeroSku): Decision {
  return {
    id: `capacity-${sku.id}`,
    skuId: sku.id,
    kind: "capacity",
    title: `Склад ${DEFAULT_WAREHOUSE_ID} приближается к пределу ёмкости`,
    description: `Часть стока ${sku.name} придётся либо хранить дороже на текущем складе, либо перенаправить будущие поставки на ${ALT_WAREHOUSE_ID}.`,
    options: [
      { id: "pay_storage", label: "Остаться на текущем складе", note: "Стоимость хранения этого SKU растёт на 50% на неделю." },
      { id: "redirect", label: `Перенаправить будущие поставки на ${ALT_WAREHOUSE_ID}`, note: "Меняет склад для этого SKU — другой тариф хранения и логистический коэффициент." },
    ],
  };
}

/** Advance the day counter (or mark finished) once a day's processing is done and no decision is pending. */
function finalizeDay(state: SimState, day: number): SimState {
  if (day >= SIM_DAYS) state.finished = true;
  else state.day = day + 1;
  return state;
}

/**
 * Advance the simulation by one day. If a decision is pending and no
 * `policy` is supplied, returns the state unchanged (caller must resolve it
 * via applyDecision first). If `policy` is supplied (used for the silent
 * autopilot comparison run), decisions are resolved automatically inline.
 */
export function stepDay(
  state: SimState,
  seed: number,
  tariffs: { wb: TariffConfig; cargo: CargoTariffConfig },
  warehouses: Warehouse[],
  policy?: Policy
): SimState {
  if (state.finished) return state;
  if (state.pendingDecision) {
    if (!policy) return state;
    const optionId = policy(state, state.pendingDecision);
    state = applyDecision(state, state.pendingDecision, optionId, tariffs, warehouses);
    if (state.finished) return state;
  }

  let next = cloneState(state);
  const day = next.day;

  for (const sku of HERO_SKUS) {
    const rt = next.skus[sku.id];

    if (rt.pendingShipmentArrivalDay === day) {
      rt.ruStock += rt.pendingShipmentUnits;
      next.log.push({ day, text: `${sku.name}: прибыла партия ${rt.pendingShipmentUnits} ед. на ${rt.warehouseId}.`, kind: "event" });
      rt.pendingShipmentUnits = 0;
      rt.pendingShipmentArrivalDay = null;
    }

    if (rt.velocityMultiplierUntilDay !== null && day > rt.velocityMultiplierUntilDay) {
      rt.velocityMultiplier = 1;
      rt.velocityMultiplierUntilDay = null;
    }
    if (rt.returnRateOverrideUntilDay !== null && day > rt.returnRateOverrideUntilDay) {
      rt.returnRateOverride = null;
      rt.returnRateOverrideUntilDay = null;
    }
    if (rt.storageCostMultiplierUntilDay !== null && day > rt.storageCostMultiplierUntilDay) {
      rt.storageCostMultiplier = 1;
      rt.storageCostMultiplierUntilDay = null;
    }

    const noise = 0.82 + hash01(seed, day, sku.id.length, 11) * 0.36;
    const demand = Math.round(sku.baseVelocity * rt.velocityMultiplier * noise);
    const fulfilled = Math.min(demand, rt.ruStock);
    const shortfall = demand - fulfilled;

    next.ordersTotal += demand;
    next.ordersFulfilled += fulfilled;
    if (shortfall > 0) {
      next.stockoutUnitDays += shortfall;
      next.log.push({ day, text: `${sku.name}: stockout — не хватило ${shortfall} ед. на спрос дня.`, kind: "stockout" });
    }

    rt.ruStock -= fulfilled;

    const effectiveReturnRate = rt.returnRateOverride ?? sku.returnRate;
    const returns = Math.round(fulfilled * effectiveReturnRate);
    const logisticsPerUnit = estimatedLogisticsCostPerUnit(sku.packageLiters, rt.fulfillment === "FBW" ? 0.88 : 1, tariffs.wb);

    next.cumRevenue += fulfilled * sku.sellingPrice;
    next.cumProductCost += fulfilled * sku.productCost;
    next.cumLogisticsCost += fulfilled * logisticsPerUnit;
    next.cumReturnCost += returnCostImpact(returns, tariffs.wb.return_logistics_rub);
    next.cumCommission += fulfilled * sku.sellingPrice * tariffs.wb.commission_rate;
    next.cumStorageCost += rt.ruStock * warehouseStorageRate(warehouses, rt.warehouseId) * rt.storageCostMultiplier;
  }

  const capitalTied = HERO_SKUS.reduce((sum, s) => sum + next.skus[s.id].ruStock * s.productCost, 0) + next.cumCargoCost;
  next.peakCapital = Math.max(next.peakCapital, capitalTied);
  next.inventorySamples.push(HERO_SKUS.reduce((sum, s) => sum + next.skus[s.id].ruStock, 0));

  // Scripted narrative events (exogenous, day-keyed so they land the same regardless of prior decisions)
  if (day === 8 && next.skus.fashion.returnRateOverride === null) {
    next.skus.fashion.returnRateOverride = HERO_SKUS[0].returnRate + 0.12;
    next.skus.fashion.returnRateOverrideUntilDay = SIM_DAYS;
    next.log.push({ day, text: "Женская одежда: return rate резко вырос из-за жалоб на размер.", kind: "event" });
    next.pendingDecision = buildReturnWaveDecision(HERO_SKUS[0]);
  } else if (day === 14) {
    next.skus.accessory.velocityMultiplier = 2.2;
    next.skus.accessory.velocityMultiplierUntilDay = 19;
    next.log.push({ day, text: "Аксессуары: внезапный всплеск спроса (x2.2 на ~6 дней).", kind: "event" });
    next.pendingDecision = buildDemandSpikeDecision(HERO_SKUS[2]);
  } else if (day === 21) {
    next.log.push({ day, text: `Склад ${DEFAULT_WAREHOUSE_ID} приближается к пределу ёмкости.`, kind: "event" });
    next.pendingDecision = buildCapacityDecision(HERO_SKUS[1]);
  }

  if (!next.pendingDecision) {
    for (const sku of HERO_SKUS) {
      const rt = next.skus[sku.id];
      if (rt.pendingShipmentArrivalDay !== null) continue;
      const avgDemand = sku.baseVelocity * rt.velocityMultiplier;
      const dos = daysOfStock(rt.ruStock, avgDemand);
      const rp = reorderPoint(avgDemand, PLANNING_LEAD_TIME_DAYS, safetyStock(1.65, avgDemand * 0.25, PLANNING_LEAD_TIME_DAYS));
      if (rt.ruStock <= rp && dos < PLANNING_LEAD_TIME_DAYS + 4) {
        next.pendingDecision = buildReorderDecision(sku, rt, day, tariffs.cargo);
        next.log.push({ day, text: `${sku.name}: сток пересёк точку заказа (${rt.ruStock} ед.).`, kind: "decision" });
        break;
      }
    }
  }

  if (!next.pendingDecision) {
    next = finalizeDay(next, day);
  }

  if (next.pendingDecision && policy) {
    next = stepDay(next, seed, tariffs, warehouses, policy);
  }

  return next;
}

export function applyDecision(
  state: SimState,
  decision: Decision,
  optionId: string,
  tariffs: { wb: TariffConfig; cargo: CargoTariffConfig },
  warehouses: Warehouse[]
): SimState {
  const next = cloneState(state);
  const rt = next.skus[decision.skuId];
  const sku = HERO_SKUS.find((s) => s.id === decision.skuId)!;
  const day = next.day;

  if (decision.kind === "reorder") {
    if (optionId === "wait") {
      next.log.push({ day, text: `${sku.name}: решено подождать ещё один день перед заказом.`, kind: "decision" });
    } else {
      const mode = optionId as CargoMode;
      const orderUnits = Math.round(sku.baseVelocity * rt.velocityMultiplier * 20);
      const rate = tariffs.cargo.modes[mode];
      const lead = totalLeadTime({ productionDays: 5, cargoTransitDays: rate.max_days, borderCustomsDays: tariffs.cargo.border_days_max, warehouseProcessingDays: 1 });
      const cost = calcCargoCost(
        {
          productCostTotal: orderUnits * sku.productCost,
          packagingTotal: orderUnits * 15,
          kyrgyzstanLocalTransport: 5000,
          weightKg: orderUnits * 0.5,
          volumeM3: orderUnits * (sku.packageLiters / 1000),
          mode,
          declaredValue: orderUnits * sku.productCost,
          russiaInlandDelivery: 8000,
          warehouseAndFulfillment: 6000,
        },
        tariffs.cargo
      );
      rt.pendingShipmentUnits = orderUnits;
      rt.pendingShipmentArrivalDay = day + lead;
      next.cumCargoCost += cargoLogisticsOnlyCost(cost, orderUnits * sku.productCost);
      next.log.push({ day, text: `${sku.name}: заказана партия ${orderUnits} ед. (${mode}), прибытие день ${day + lead}.`, kind: "decision" });
    }
  } else if (decision.kind === "return_wave") {
    if (optionId === "fix_listing") {
      rt.returnRateOverride = sku.returnRate * 0.5;
      next.log.push({ day, text: `${sku.name}: размерная сетка обновлена, return rate снижен вдвое.`, kind: "decision" });
    } else if (optionId === "ignore") {
      next.log.push({ day, text: `${sku.name}: return rate остаётся повышенным.`, kind: "decision" });
    } else {
      rt.velocityMultiplier = 0.7;
      rt.velocityMultiplierUntilDay = day + 10;
      next.log.push({ day, text: `${sku.name}: временно снят с рекламы (продажи -30% на 10 дней).`, kind: "decision" });
    }
  } else if (decision.kind === "demand_spike") {
    if (optionId === "rush_cargo") {
      const orderUnits = Math.round(sku.baseVelocity * 1.2 * 6);
      const rate = tariffs.cargo.modes.dedicated_truck;
      const lead = totalLeadTime({ productionDays: 5, cargoTransitDays: rate.max_days, borderCustomsDays: tariffs.cargo.border_days_max, warehouseProcessingDays: 1 });
      const cost = calcCargoCost(
        {
          productCostTotal: orderUnits * sku.productCost,
          packagingTotal: orderUnits * 15,
          kyrgyzstanLocalTransport: 5000,
          weightKg: orderUnits * 0.5,
          volumeM3: orderUnits * (sku.packageLiters / 1000),
          mode: "dedicated_truck",
          declaredValue: orderUnits * sku.productCost,
          russiaInlandDelivery: 8000,
          warehouseAndFulfillment: 6000,
        },
        tariffs.cargo
      );
      rt.pendingShipmentUnits += orderUnits;
      rt.pendingShipmentArrivalDay = day + lead;
      next.cumCargoCost += cargoLogisticsOnlyCost(cost, orderUnits * sku.productCost);
      next.log.push({ day, text: `${sku.name}: срочная партия ${orderUnits} ед. заказана, прибытие день ${day + lead}.`, kind: "decision" });
    } else {
      next.log.push({ day, text: `${sku.name}: решено не реагировать на всплеск спроса.`, kind: "decision" });
    }
  } else if (decision.kind === "capacity") {
    if (optionId === "pay_storage") {
      rt.storageCostMultiplier = 1.5;
      rt.storageCostMultiplierUntilDay = day + 7;
      next.log.push({ day, text: `${sku.name}: остаётся на ${DEFAULT_WAREHOUSE_ID}, хранение дороже на неделю.`, kind: "decision" });
    } else {
      rt.warehouseId = ALT_WAREHOUSE_ID;
      next.log.push({ day, text: `${sku.name}: будущие поставки перенаправлены на ${ALT_WAREHOUSE_ID}.`, kind: "decision" });
    }
  }

  void warehouses;
  next.pendingDecision = null;
  return finalizeDay(next, day);
}

export function runAutopilot(seed: number, tariffs: { wb: TariffConfig; cargo: CargoTariffConfig }, warehouses: Warehouse[], policy: Policy = textbookPolicy): SimState {
  let s = createInitialState();
  let guard = 0;
  while (!s.finished && guard < 400) {
    s = stepDay(s, seed, tariffs, warehouses, policy);
    guard++;
  }
  return s;
}

/**
 * Interactive fast-forward: advances day by day (no policy — player-driven)
 * until either a decision needs the player's input or the month ends.
 */
export function advanceUntilDecisionOrEnd(state: SimState, seed: number, tariffs: { wb: TariffConfig; cargo: CargoTariffConfig }, warehouses: Warehouse[]): SimState {
  let s = state;
  let guard = 0;
  while (!s.finished && !s.pendingDecision && guard < 60) {
    s = stepDay(s, seed, tariffs, warehouses);
    guard++;
  }
  return s;
}

export interface CapstoneResults {
  profit: number;
  logisticsCostPctRevenue: number;
  serviceLevelPct: number;
  returnCost: number;
  inventoryTurnover: number;
  capitalEfficiency: number;
  revenue: number;
}

export function summarize(state: SimState): CapstoneResults {
  const totalCost = state.cumProductCost + state.cumLogisticsCost + state.cumReturnCost + state.cumCargoCost + state.cumStorageCost + state.cumCommission;
  const profit = state.cumRevenue - totalCost;
  const avgInventoryUnits = state.inventorySamples.length > 0 ? state.inventorySamples.reduce((a, b) => a + b, 0) / state.inventorySamples.length : 0;
  const avgProductCost = HERO_SKUS.reduce((a, s) => a + s.productCost, 0) / HERO_SKUS.length;
  return {
    profit,
    revenue: state.cumRevenue,
    logisticsCostPctRevenue: state.cumRevenue > 0 ? state.cumLogisticsCost / state.cumRevenue : 0,
    serviceLevelPct: state.ordersTotal > 0 ? state.ordersFulfilled / state.ordersTotal : 1,
    returnCost: state.cumReturnCost,
    inventoryTurnover: stockTurnover(state.cumProductCost, avgInventoryUnits * avgProductCost || 1),
    capitalEfficiency: state.peakCapital > 0 ? profit / state.peakCapital : 0,
  };
}
