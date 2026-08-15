// Thin client for the backend (server/, deployed separately on Vercel).
// Every function here can fail (network down, backend cold-start timeout,
// CORS misconfig) — callers are expected to catch and fall back to the
// bundled static data, see state/dataStore.tsx.
import type { SKU, Warehouse, TariffConfig } from "../data/types";
import type { DailyMetric } from "../data/sampleData";
import { cargoTariffs as staticCargoTariffs } from "../data/tariffs";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export type CargoTariffConfig = typeof staticCargoTariffs;

export interface TariffsResponse {
  wb: TariffConfig;
  cargo: CargoTariffConfig;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("VITE_API_URL is not configured");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** JSON round-trips through the backend turn Infinity into null; restore it. */
function normalizeWbTariffs(t: TariffConfig): TariffConfig {
  return {
    ...t,
    volume_brackets: t.volume_brackets.map((b) => ({
      ...b,
      max_liters: b.max_liters === null ? Infinity : b.max_liters,
    })),
  };
}

export function fetchSkus() {
  return request<SKU[]>("/api/skus");
}

export function fetchWarehouses() {
  return request<Warehouse[]>("/api/warehouses");
}

export async function fetchTariffs(): Promise<TariffsResponse> {
  const data = await request<TariffsResponse>("/api/tariffs");
  return { wb: normalizeWbTariffs(data.wb), cargo: data.cargo };
}

export function fetchDailyMetrics() {
  return request<DailyMetric[]>("/api/daily-metrics");
}

function authHeaders(adminToken: string) {
  return { Authorization: `Bearer ${adminToken}` };
}

export function createSku(sku: SKU, adminToken: string) {
  return request<{ ok: true }>("/api/skus", { method: "POST", headers: authHeaders(adminToken), body: JSON.stringify(sku) });
}
export function updateSku(sku: SKU, adminToken: string) {
  return request<{ ok: true }>(`/api/skus/${encodeURIComponent(sku.sku_id)}`, { method: "PUT", headers: authHeaders(adminToken), body: JSON.stringify(sku) });
}
export function deleteSku(skuId: string, adminToken: string) {
  return request<{ ok: true }>(`/api/skus/${encodeURIComponent(skuId)}`, { method: "DELETE", headers: authHeaders(adminToken) });
}

export function createWarehouse(w: Warehouse, adminToken: string) {
  return request<{ ok: true }>("/api/warehouses", { method: "POST", headers: authHeaders(adminToken), body: JSON.stringify(w) });
}
export function updateWarehouse(w: Warehouse, adminToken: string) {
  return request<{ ok: true }>(`/api/warehouses/${encodeURIComponent(w.warehouse_id)}`, { method: "PUT", headers: authHeaders(adminToken), body: JSON.stringify(w) });
}
export function deleteWarehouse(warehouseId: string, adminToken: string) {
  return request<{ ok: true }>(`/api/warehouses/${encodeURIComponent(warehouseId)}`, { method: "DELETE", headers: authHeaders(adminToken) });
}

export function updateTariffs(key: "wb" | "cargo", data: unknown, adminToken: string) {
  return request<{ ok: true }>(`/api/tariffs/${key}`, { method: "PUT", headers: authHeaders(adminToken), body: JSON.stringify(data) });
}
