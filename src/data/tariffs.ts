import type { TariffConfig } from "./types";

/**
 * TARIFF CONFIGURATION LAYER
 * ==========================
 * Wildberries regularly changes tariffs, coefficients, warehouse conditions
 * and FBS/FBW rules. This file intentionally does NOT claim to represent
 * current, live WB tariffs — that would go stale immediately and mislead
 * a real operating decision.
 *
 * Everything below is a MODEL ASSUMPTION used only to teach the shape of
 * the calculations (how volume -> tariff -> cost flows through the system).
 * Before using any number here for a real business decision, replace it
 * with the current value from the official Wildberries seller documentation
 * (WB Partner Portal / seller.wildberries.ru) and update `as_of_date`.
 *
 * This separation (business logic in lib/formulas.ts, numbers here) is
 * deliberate: change a tariff by editing this file only, never the formulas.
 */
export const wbTariffs: TariffConfig = {
  as_of_date: "2026-08-15",
  is_assumption: true,
  source_note:
    "Illustrative model values for training purposes only. Replace with the current tariff table from the official Wildberries seller portal before using in real planning.",
  volume_brackets: [
    { max_liters: 1, label: "До 1 л", coefficient: 1.0 },
    { max_liters: 5, label: "1–5 л", coefficient: 1.4 },
    { max_liters: 10, label: "5–10 л", coefficient: 1.9 },
    { max_liters: 20, label: "10–20 л", coefficient: 2.6 },
    { max_liters: Infinity, label: "Свыше 20 л", coefficient: 3.5 },
  ],
  logistics_base_rub: 45,
  logistics_per_liter_rub: 10,
  storage_free_days: 60,
  storage_per_unit_day_rub: 0.15,
  commission_rate: 0.19,
  return_logistics_rub: 55,
  acceptance_coefficient_default: 1.0,
};

/**
 * Cross-border cargo tariffs (Kyrgyzstan -> Russia).
 * Same disclosure applies: these are teaching placeholders, not live carrier
 * rates. Real rates depend on the specific carrier, route, cargo type and
 * current customs regime and must be sourced from your freight/broker
 * contracts.
 */
export const cargoTariffs = {
  as_of_date: "2026-08-15",
  is_assumption: true,
  source_note:
    "Illustrative model values for training purposes only. Replace with your carrier/broker's current rate sheet.",
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
  loss_and_damage_rate: 0.006, // fraction of declared cargo value
  truck_capacity_m3: 82, // standard tent truck (fura), reference only
  truck_capacity_kg: 20000,
};
