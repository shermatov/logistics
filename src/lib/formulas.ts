// Central calculation engine (§33). Every formula used anywhere in the app
// lives here, so a number always has exactly one implementation.
//
// Tariff-dependent functions take the tariff table as an optional parameter,
// defaulting to the bundled static fallback (data/tariffs.ts). Callers that
// have live tariffs from the backend (via useDataStore) should pass them
// explicitly; everything else keeps working unchanged against the fallback.
import { wbTariffs, cargoTariffs } from "../data/tariffs";
import type { CargoMode, TariffConfig } from "../data/types";

// ---------- Packaging & volume (§5, §8) ----------

export function volumeLiters(lengthCm: number, widthCm: number, heightCm: number): number {
  return (lengthCm * widthCm * heightCm) / 1000;
}

export function volumeM3(lengthCm: number, widthCm: number, heightCm: number): number {
  return (lengthCm * widthCm * heightCm) / 1_000_000;
}

export function volumeBracket(liters: number, tariffs: TariffConfig = wbTariffs) {
  return tariffs.volume_brackets.find((b) => liters <= b.max_liters) ?? tariffs.volume_brackets[tariffs.volume_brackets.length - 1];
}

export function estimatedLogisticsCostPerUnit(liters: number, coefficient = 1, tariffs: TariffConfig = wbTariffs): number {
  const bracket = volumeBracket(liters, tariffs);
  return (tariffs.logistics_base_rub + tariffs.logistics_per_liter_rub * liters) * bracket.coefficient * coefficient;
}

export function logisticsCostShareOfPrice(logisticsCost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return logisticsCost / sellingPrice;
}

// ---------- Inventory management (§10) ----------

/** Days of Stock = Current Inventory / Average Daily Sales */
export function daysOfStock(currentInventory: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return Infinity;
  return currentInventory / avgDailySales;
}

/** Stock Turnover = COGS / Average Inventory (annualized if inputs are annual) */
export function stockTurnover(cogs: number, avgInventory: number): number {
  if (avgInventory <= 0) return 0;
  return cogs / avgInventory;
}

/** Reorder Point = Demand During Lead Time + Safety Stock */
export function reorderPoint(avgDailySales: number, leadTimeDays: number, safetyStock: number): number {
  return avgDailySales * leadTimeDays + safetyStock;
}

/**
 * Safety Stock using demand-variability method:
 * SS = z * sigma_demand * sqrt(leadTimeDays)
 * z is the service-level factor (e.g. 1.65 for ~95% service level).
 */
export function safetyStock(zScore: number, demandStdDev: number, leadTimeDays: number): number {
  return zScore * demandStdDev * Math.sqrt(leadTimeDays);
}

export function sellThroughRate(unitsSold: number, unitsReceived: number): number {
  if (unitsReceived <= 0) return 0;
  return unitsSold / unitsReceived;
}

export function stockoutRisk(daysOfStockValue: number, leadTimeDays: number): "low" | "medium" | "high" {
  if (daysOfStockValue <= leadTimeDays * 0.75) return "high";
  if (daysOfStockValue <= leadTimeDays * 1.5) return "medium";
  return "low";
}

// ---------- Returns (§13) ----------

export function returnRate(returns: number, orders: number): number {
  if (orders <= 0) return 0;
  return returns / orders;
}

export function returnCostImpact(returns: number, costPerReturn: number): number {
  return returns * costPerReturn;
}

// ---------- Logistics economics (§4, §7) ----------

export interface UnitEconomicsInput {
  sellingPrice: number;
  productCost: number;
  packagingCost: number;
  logisticsCost: number;
  storageCost: number;
  acceptanceCost: number;
  returnCostAllocated: number;
  advertisingCost: number;
  fulfillmentCost: number;
  commissionRate: number; // 0..1
  taxRate: number; // 0..1, applied on revenue for simplicity (Russian STS-like)
}

export interface UnitEconomicsResult extends UnitEconomicsInput {
  commissionAmount: number;
  taxAmount: number;
  totalCosts: number;
  contribution: number;
  contributionMarginPct: number;
  logisticsCostSharePct: number;
}

export function calcUnitEconomics(input: UnitEconomicsInput): UnitEconomicsResult {
  const commissionAmount = input.sellingPrice * input.commissionRate;
  const taxAmount = input.sellingPrice * input.taxRate;
  const totalCosts =
    commissionAmount +
    input.logisticsCost +
    input.storageCost +
    input.acceptanceCost +
    input.returnCostAllocated +
    input.advertisingCost +
    input.productCost +
    input.packagingCost +
    input.fulfillmentCost +
    taxAmount;
  const contribution = input.sellingPrice - totalCosts;
  return {
    ...input,
    commissionAmount,
    taxAmount,
    totalCosts,
    contribution,
    contributionMarginPct: input.sellingPrice > 0 ? contribution / input.sellingPrice : 0,
    logisticsCostSharePct: input.sellingPrice > 0 ? input.logisticsCost / input.sellingPrice : 0,
  };
}

/** Logistics cost per successful sale accounts for the units that come back. */
export function logisticsCostPerSuccessfulSale(
  logisticsCostPerOrder: number,
  returnLogisticsCost: number,
  returnRateValue: number
): number {
  const survivalRate = 1 - returnRateValue;
  if (survivalRate <= 0) return Infinity;
  return (logisticsCostPerOrder + returnRateValue * returnLogisticsCost) / survivalRate;
}

export function costToServe(
  logisticsCost: number,
  storageCost: number,
  fulfillmentCost: number,
  returnCostAllocated: number
): number {
  return logisticsCost + storageCost + fulfillmentCost + returnCostAllocated;
}

export function roi(profit: number, investment: number): number {
  if (investment <= 0) return 0;
  return profit / investment;
}

// ---------- Warehouse distribution / localization (§11, §12) ----------

export interface WarehouseAllocation {
  warehouseId: string;
  demandShare: number;
  allocatedUnits: number;
}

/** Allocate total stock proportionally to demand share across warehouses. */
export function allocateByDemand(totalUnits: number, shares: { warehouseId: string; demandShare: number }[]): WarehouseAllocation[] {
  const totalShare = shares.reduce((s, w) => s + w.demandShare, 0) || 1;
  return shares.map((w) => ({
    warehouseId: w.warehouseId,
    demandShare: w.demandShare,
    allocatedUnits: Math.round((w.demandShare / totalShare) * totalUnits),
  }));
}

/**
 * Weighted average delivery distance/time proxy: sum(demandShare * mismatchPenalty)
 * where mismatchPenalty grows when inventory share diverges from demand share.
 * Used to illustrate why centralization hurts delivery speed when demand is spread out.
 */
export function allocationMismatchScore(
  demandShares: Record<string, number>,
  stockShares: Record<string, number>
): number {
  const regions = new Set([...Object.keys(demandShares), ...Object.keys(stockShares)]);
  let score = 0;
  regions.forEach((r) => {
    const d = demandShares[r] ?? 0;
    const s = stockShares[r] ?? 0;
    score += Math.abs(d - s);
  });
  return score / 2; // 0 = perfectly matched, 1 = fully mismatched
}

// ---------- Cross-border cargo economics (§43.3 - §43.7) ----------

export interface CargoCostInputs {
  productCostTotal: number;
  packagingTotal: number;
  kyrgyzstanLocalTransport: number;
  weightKg: number;
  volumeM3: number;
  mode: CargoMode;
  declaredValue: number;
  russiaInlandDelivery: number;
  warehouseAndFulfillment: number;
  insuranceRate?: number; // 0..1 of declared value, optional
  otherCosts?: number;
}

export interface CargoCostResult {
  breakdown: {
    product_cost: number;
    packaging: number;
    kyrgyzstan_local_transport: number;
    cross_border_freight: number;
    customs_and_documentation: number;
    broker_fee: number;
    russia_inland_delivery: number;
    warehouse_and_fulfillment: number;
    insurance: number;
    losses_and_damage: number;
    other: number;
  };
  totalCargoCost: number;
  freightByWeight: number;
  freightByVolume: number;
  transitDaysRange: [number, number];
}

export function calcCargoCost(input: CargoCostInputs, tariffs: typeof cargoTariffs = cargoTariffs): CargoCostResult {
  const rate = tariffs.modes[input.mode];
  const freightByWeight = input.weightKg * rate.cost_per_kg_rub;
  const freightByVolume = input.volumeM3 * rate.cost_per_m3_rub;
  // Carriers bill whichever is higher (weight vs volumetric) — standard freight practice.
  const cross_border_freight = Math.max(freightByWeight, freightByVolume);
  const insurance = (input.insuranceRate ?? 0) * input.declaredValue;
  const losses_and_damage = tariffs.loss_and_damage_rate * input.declaredValue;

  const breakdown = {
    product_cost: input.productCostTotal,
    packaging: input.packagingTotal,
    kyrgyzstan_local_transport: input.kyrgyzstanLocalTransport,
    cross_border_freight,
    customs_and_documentation: tariffs.customs_and_documentation_per_shipment_rub,
    broker_fee: tariffs.broker_fee_per_shipment_rub,
    russia_inland_delivery: input.russiaInlandDelivery,
    warehouse_and_fulfillment: input.warehouseAndFulfillment,
    insurance,
    losses_and_damage,
    other: input.otherCosts ?? 0,
  };

  const totalCargoCost = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    breakdown,
    totalCargoCost,
    freightByWeight,
    freightByVolume,
    transitDaysRange: [
      rate.min_days + tariffs.border_days_min,
      rate.max_days + tariffs.border_days_max,
    ],
  };
}

export interface FullyLandedCostInput {
  productCostPerUnit: number;
  packagingPerUnit: number;
  kyrgyzstanLogisticsPerUnit: number;
  crossBorderCargoPerUnit: number;
  customsPerUnit: number;
  russiaLogisticsPerUnit: number;
  warehousePerUnit: number;
  fulfillmentPerUnit: number;
}

export function fullyLandedCostPerUnit(input: FullyLandedCostInput): number {
  return (
    input.productCostPerUnit +
    input.packagingPerUnit +
    input.kyrgyzstanLogisticsPerUnit +
    input.crossBorderCargoPerUnit +
    input.customsPerUnit +
    input.russiaLogisticsPerUnit +
    input.warehousePerUnit +
    input.fulfillmentPerUnit
  );
}

export function realContribution(sellingPrice: number, marketplaceCosts: number, fullyLandedCost: number): number {
  return sellingPrice - marketplaceCosts - fullyLandedCost;
}

// ---------- Cargo planning / lead time (§43.5, §43.12) ----------

export interface LeadTimeBreakdown {
  productionDays: number;
  cargoTransitDays: number;
  borderCustomsDays: number;
  warehouseProcessingDays: number;
}

export function totalLeadTime(b: LeadTimeBreakdown): number {
  return b.productionDays + b.cargoTransitDays + b.borderCustomsDays + b.warehouseProcessingDays;
}

/** Additional buffer stock required to bridge a lead time, given a daily sales rate. */
export function requiredBufferStock(dailySales: number, totalLeadTimeDays: number, safetyStockUnits: number): number {
  return dailySales * totalLeadTimeDays + safetyStockUnits;
}

// ---------- Truck / cargo capacity (§43.7) ----------

export interface CapacityInput {
  unitLengthCm: number;
  unitWidthCm: number;
  unitHeightCm: number;
  unitWeightKg: number;
  quantity: number;
  truckVolumeM3?: number;
  truckWeightKg?: number;
}

export interface CapacityResult {
  totalVolumeM3: number;
  totalWeightKg: number;
  volumeUtilizationPct: number;
  weightUtilizationPct: number;
  limitingFactor: "volume" | "weight";
  remainingUnitsByVolume: number;
  remainingUnitsByWeight: number;
  maxUnitsThatFit: number;
}

export function calcTruckCapacity(input: CapacityInput, tariffs: typeof cargoTariffs = cargoTariffs): CapacityResult {
  const truckVolume = input.truckVolumeM3 ?? tariffs.truck_capacity_m3;
  const truckWeight = input.truckWeightKg ?? tariffs.truck_capacity_kg;
  const unitVolume = (input.unitLengthCm * input.unitWidthCm * input.unitHeightCm) / 1_000_000;

  const totalVolumeM3 = unitVolume * input.quantity;
  const totalWeightKg = input.unitWeightKg * input.quantity;

  const maxByVolume = unitVolume > 0 ? Math.floor(truckVolume / unitVolume) : Infinity;
  const maxByWeight = input.unitWeightKg > 0 ? Math.floor(truckWeight / input.unitWeightKg) : Infinity;
  const maxUnitsThatFit = Math.min(maxByVolume, maxByWeight);

  return {
    totalVolumeM3,
    totalWeightKg,
    volumeUtilizationPct: (totalVolumeM3 / truckVolume) * 100,
    weightUtilizationPct: (totalWeightKg / truckWeight) * 100,
    limitingFactor: maxByVolume <= maxByWeight ? "volume" : "weight",
    remainingUnitsByVolume: Math.max(0, maxByVolume - input.quantity),
    remainingUnitsByWeight: Math.max(0, maxByWeight - input.quantity),
    maxUnitsThatFit,
  };
}

// ---------- Own warehouse economics (§12) ----------

export interface OwnWarehouseCostInput {
  rent: number;
  labor: number;
  packaging: number;
  equipment: number;
  utilities: number;
  software: number;
  errors: number;
  returns: number;
}

export interface OwnWarehouseCostResult {
  totalOperatingCost: number;
  costPerOrder: number;
  costPerUnit: number;
  costPerEmployee: number;
  ordersPerHour: number;
  ordersPerEmployee: number;
}

export function calcOwnWarehouseCost(
  input: OwnWarehouseCostInput,
  volume: { orders: number; units: number; employees: number; hoursPerPeriod: number }
): OwnWarehouseCostResult {
  const totalOperatingCost = Object.values(input).reduce((a, b) => a + b, 0);
  return {
    totalOperatingCost,
    costPerOrder: volume.orders > 0 ? totalOperatingCost / volume.orders : 0,
    costPerUnit: volume.units > 0 ? totalOperatingCost / volume.units : 0,
    costPerEmployee: volume.employees > 0 ? totalOperatingCost / volume.employees : 0,
    ordersPerHour: volume.hoursPerPeriod > 0 ? volume.orders / volume.hoursPerPeriod : 0,
    ordersPerEmployee: volume.employees > 0 ? volume.orders / volume.employees : 0,
  };
}

// ---------- Formatting helpers ----------

export function fmtRub(value: number): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value)) + " ₽";
}

export function fmtPct(value: number, digits = 1): string {
  if (!isFinite(value)) return "—";
  return (value * 100).toFixed(digits) + "%";
}

export function fmtNum(value: number, digits = 0): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(value);
}
