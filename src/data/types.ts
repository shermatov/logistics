// Central data model for the Logistics Management System.
// Mirrors the entity list from the project spec (§32) plus the
// Kyrgyzstan -> Russia cargo extension (§43).

export type FulfillmentModel = "FBS" | "FBW";

export interface SKU {
  sku_id: string;
  product_name: string;
  category: string;
  selling_price: number; // RUB
  product_cost: number; // RUB, cost in Kyrgyzstan before any logistics
  package_length_cm: number;
  package_width_cm: number;
  package_height_cm: number;
  package_weight_kg: number;
  return_rate: number; // 0..1
  sales_velocity: number; // units/day, company-wide
  fulfillment_model: FulfillmentModel;
  demand_geography: Record<string, number>; // region -> share of demand (0..1)
}

export interface Warehouse {
  warehouse_id: string;
  name: string;
  region: string;
  country: "KG" | "RU";
  role: "supplier" | "consolidation" | "fulfillment" | "wb_sc";
  capacity_units: number;
  current_stock_units: number;
  logistics_coefficient: number; // relative WB logistics multiplier, 1.0 = baseline
  storage_cost_per_unit_day: number; // RUB
  demand_share: number; // 0..1, share of national demand this WH is best positioned to serve
}

export interface DemandRecord {
  sku_id: string;
  region: string;
  daily_orders: number;
}

export type OrderStatus = "delivered" | "in_transit" | "cancelled" | "returned";

export interface OrderRecord {
  order_id: string;
  sku_id: string;
  warehouse_id: string;
  date: string; // ISO date
  status: OrderStatus;
  delivery_time_days: number;
  fulfillment_model: FulfillmentModel;
}

export type ReturnReason =
  | "size_mismatch"
  | "fit"
  | "quality"
  | "expectation_mismatch"
  | "changed_mind"
  | "damaged_in_transit"
  | "other";

export interface ReturnRecord {
  return_id: string;
  order_id: string;
  reason: ReturnReason;
  cost: number; // RUB, reverse logistics + restocking cost
  date: string;
}

export interface ShipmentRecord {
  shipment_id: string;
  warehouse_id: string;
  destination: string;
  volume_m3: number;
  weight_kg: number;
  cost: number;
  date: string;
}

// ---- Cross-border cargo (KG -> RU), §43 ----

export type CargoMode = "consolidated_lcl" | "dedicated_truck" | "partial_truck" | "railway" | "3pl";

export interface CargoShipment {
  cargo_id: string;
  mode: CargoMode;
  origin_warehouse_id: string; // KG
  destination_warehouse_id: string; // RU
  departure_date: string;
  eta_date: string;
  status: "preparing" | "in_transit" | "customs" | "arrived" | "delayed";
  volume_m3: number;
  weight_kg: number;
  units: number;
  declared_value_rub: number;
  cost_breakdown: CargoCostBreakdown;
}

export interface CargoCostBreakdown {
  product_cost: number;
  packaging: number;
  kyrgyzstan_local_transport: number;
  cross_border_freight: number;
  customs_and_documentation: number;
  broker_fee: number;
  unloading: number;
  russia_inland_delivery: number;
  warehouse_and_fulfillment: number;
  insurance: number;
  other: number;
  losses_and_damage: number;
}

// ---- Tariff / configuration layer, §8 & §34 ----
// IMPORTANT: values here are illustrative placeholders for teaching the model,
// NOT current live Wildberries tariffs. See data/tariffs.ts header for the
// "as of" / assumption disclosure required by the spec.
export interface TariffConfig {
  as_of_date: string;
  is_assumption: boolean;
  source_note: string;
  volume_brackets: { max_liters: number; label: string; coefficient: number }[];
  logistics_base_rub: number;
  logistics_per_liter_rub: number;
  storage_free_days: number;
  storage_per_unit_day_rub: number;
  commission_rate: number; // marketplace commission, category-average
  return_logistics_rub: number;
  acceptance_coefficient_default: number;
}
