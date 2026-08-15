import { useState } from "react";
import { ShieldCheck, Lock, Pencil, Trash2, Plus, X, RefreshCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { SectionHeading, NumberField, SelectField, Pill } from "../components/ui/Misc";
import { useDataStore } from "../state/dataStore";
import { regions } from "../data/sampleData";
import type { SKU, Warehouse, FulfillmentModel } from "../data/types";
import {
  createSku,
  updateSku,
  deleteSku,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  updateTariffs,
  API_URL,
} from "../lib/api";
import { fmtRub, fmtPct, fmtNum } from "../lib/formulas";

const TOKEN_KEY = "logistics-admin-token";

type Tab = "skus" | "warehouses" | "tariffs";

function useAdminToken() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const save = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };
  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  };
  return { token, save, clear };
}

function emptySku(): SKU {
  const demand_geography: Record<string, number> = {};
  regions.forEach((r) => (demand_geography[r] = 1 / regions.length));
  return {
    sku_id: "",
    product_name: "",
    category: "",
    selling_price: 0,
    product_cost: 0,
    package_length_cm: 20,
    package_width_cm: 15,
    package_height_cm: 5,
    package_weight_kg: 0.3,
    return_rate: 0.1,
    sales_velocity: 10,
    fulfillment_model: "FBS",
    demand_geography,
  };
}

function emptyWarehouse(): Warehouse {
  return {
    warehouse_id: "",
    name: "",
    region: "",
    country: "RU",
    role: "fulfillment",
    capacity_units: 10000,
    current_stock_units: 0,
    logistics_coefficient: 1,
    storage_cost_per_unit_day: 0.15,
    demand_share: 0.1,
  };
}

export function AdminPage() {
  const { token, save, clear } = useAdminToken();
  const [tokenInput, setTokenInput] = useState("");

  if (!API_URL) {
    return (
      <div className="max-w-2xl">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} strokeWidth={2.4} style={{ color: "var(--status-warning)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Backend не настроен</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            VITE_API_URL не задан для этой сборки — админка работает только когда фронтенд подключён к{" "}
            <code>server/</code>. Смотрите <code>/roadmap</code>.
          </p>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "color-mix(in srgb, var(--series-7) 16%, transparent)", color: "var(--series-7)" }}>
              <Lock size={15} strokeWidth={2.4} />
            </span>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Admin-токен</h3>
          </div>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Изменение SKU/складов/тарифов требует admin-токен backend'а (переменная <code>ADMIN_TOKEN</code> на сервере).
            Это не полноценная авторизация — общий секрет, см. <code>/roadmap</code>.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Введите admin-токен"
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => save(tokenInput)}
              disabled={!tokenInput}
              className="text-sm font-semibold rounded-[var(--radius-pill)] px-4 py-2 disabled:opacity-40"
              style={{ background: "var(--gradient-brand)", color: "white" }}
            >
              Войти
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return <AdminConsole token={token} onLogout={clear} />;
}

function AdminConsole({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("skus");

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg, var(--series-7), var(--series-5))", color: "white", boxShadow: "var(--shadow-sm)" }}>
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-7)" }}>Admin</div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Управление данными</h1>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs font-medium underline shrink-0" style={{ color: "var(--text-muted)" }}>
            Выйти
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["skus", "SKU"],
            ["warehouses", "Склады"],
            ["tariffs", "Тарифы"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="text-sm font-semibold rounded-[var(--radius-pill)] px-4 py-2 transition-all duration-150"
            style={{
              background: tab === key ? "var(--gradient-brand)" : "var(--surface-1)",
              color: tab === key ? "white" : "var(--text-primary)",
              border: tab === key ? "none" : "1px solid var(--border)",
              boxShadow: tab === key ? "var(--shadow-sm)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "skus" && <SkusTab token={token} />}
      {tab === "warehouses" && <WarehousesTab token={token} />}
      {tab === "tariffs" && <TariffsTab token={token} />}
    </div>
  );
}

function Toast({ message, tone }: { message: string; tone: "good" | "critical" }) {
  return (
    <div
      className="pop-in inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
      style={{
        color: tone === "good" ? "var(--status-good)" : "var(--status-critical)",
        background: `color-mix(in srgb, ${tone === "good" ? "var(--status-good)" : "var(--status-critical)"} 14%, transparent)`,
      }}
    >
      {tone === "good" ? <CheckCircle2 size={13} strokeWidth={2.4} /> : <AlertTriangle size={13} strokeWidth={2.4} />}
      {message}
    </div>
  );
}

function SkusTab({ token }: { token: string }) {
  const { skus, sources, refetch } = useDataStore();
  const [editing, setEditing] = useState<SKU | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "good" | "critical" } | null>(null);

  async function handleSave(sku: SKU, isNew: boolean) {
    try {
      if (isNew) await createSku(sku, token);
      else await updateSku(sku, token);
      setToast({ message: "Сохранено", tone: "good" });
      setEditing(null);
      setCreating(false);
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка сохранения", tone: "critical" });
    }
  }

  async function handleDelete(skuId: string) {
    if (!confirm(`Удалить ${skuId}?`)) return;
    try {
      await deleteSku(skuId, token);
      setToast({ message: "Удалено", tone: "good" });
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка удаления", tone: "critical" });
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionHeading eyebrow={`Источник: ${sources.skus === "live" ? "backend" : sources.skus}`} title={`SKU (${skus.length})`} />
        <div className="flex items-center gap-3">
          {toast && <Toast {...toast} />}
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-4 py-2"
            style={{ background: "var(--gradient-fresh)", color: "white", boxShadow: "var(--shadow-sm)" }}
          >
            <Plus size={14} strokeWidth={2.4} /> Добавить SKU
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <SkuForm
          initial={editing ?? emptySku()}
          isNew={!editing}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(s) => handleSave(s, !editing)}
        />
      )}

      <Card padded={false}>
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>SKU</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Название</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Цена</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Return rate</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Модель</th>
                <th className="text-right px-4 py-3" style={{ color: "var(--text-muted)" }}></th>
              </tr>
            </thead>
            <tbody>
              {skus.map((s, i) => (
                <tr key={s.sku_id} style={{ borderBottom: i < skus.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{s.sku_id}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>{s.product_name}</td>
                  <td className="px-4 py-2.5 tabular" style={{ color: "var(--text-secondary)" }}>{fmtRub(s.selling_price)}</td>
                  <td className="px-4 py-2.5 tabular" style={{ color: "var(--text-secondary)" }}>{fmtPct(s.return_rate)}</td>
                  <td className="px-4 py-2.5"><Pill tone={s.fulfillment_model === "FBW" ? "blue" : "orange"}>{s.fulfillment_model}</Pill></td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(s)} className="w-7 h-7 rounded-lg grid place-items-center" style={{ color: "var(--series-1)", background: "var(--surface-2)" }}>
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>
                      <button onClick={() => handleDelete(s.sku_id)} className="w-7 h-7 rounded-lg grid place-items-center" style={{ color: "var(--status-critical)", background: "var(--surface-2)" }}>
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function SkuForm({ initial, isNew, onSave, onCancel }: { initial: SKU; isNew: boolean; onSave: (s: SKU) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SKU>(initial);
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{isNew ? "Новый SKU" : `Редактирование ${form.sku_id}`}</h3>
        <button onClick={onCancel} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>SKU ID</span>
          <input
            disabled={!isNew}
            value={form.sku_id}
            onChange={(e) => setForm({ ...form, sku_id: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm col-span-2">
          <span style={{ color: "var(--text-secondary)" }}>Название</span>
          <input
            value={form.product_name}
            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Категория</span>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <NumberField label="Цена продажи, ₽" value={form.selling_price} onChange={(v) => setForm({ ...form, selling_price: v })} />
        <NumberField label="Себестоимость, ₽" value={form.product_cost} onChange={(v) => setForm({ ...form, product_cost: v })} />
        <NumberField label="Длина, см" value={form.package_length_cm} onChange={(v) => setForm({ ...form, package_length_cm: v })} />
        <NumberField label="Ширина, см" value={form.package_width_cm} onChange={(v) => setForm({ ...form, package_width_cm: v })} />
        <NumberField label="Высота, см" value={form.package_height_cm} onChange={(v) => setForm({ ...form, package_height_cm: v })} />
        <NumberField label="Вес, кг" value={form.package_weight_kg} onChange={(v) => setForm({ ...form, package_weight_kg: v })} step={0.01} />
        <NumberField label="Return rate (0-1)" value={form.return_rate} onChange={(v) => setForm({ ...form, return_rate: v })} step={0.01} />
        <NumberField label="Продаж/день" value={form.sales_velocity} onChange={(v) => setForm({ ...form, sales_velocity: v })} />
        <SelectField
          label="Модель"
          value={form.fulfillment_model}
          onChange={(v) => setForm({ ...form, fulfillment_model: v as FulfillmentModel })}
          options={[
            { value: "FBS", label: "FBS" },
            { value: "FBW", label: "FBW" },
          ]}
        />
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Demand geography</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {regions.map((r) => (
            <NumberField
              key={r}
              label={r}
              value={form.demand_geography[r] ?? 0}
              step={0.01}
              onChange={(v) => setForm({ ...form, demand_geography: { ...form.demand_geography, [r]: v } })}
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={!form.sku_id || !form.product_name}
        className="mt-4 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 disabled:opacity-40"
        style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
      >
        Сохранить
      </button>
    </Card>
  );
}

function WarehousesTab({ token }: { token: string }) {
  const { warehouses, sources, refetch } = useDataStore();
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "good" | "critical" } | null>(null);

  async function handleSave(w: Warehouse, isNew: boolean) {
    try {
      if (isNew) await createWarehouse(w, token);
      else await updateWarehouse(w, token);
      setToast({ message: "Сохранено", tone: "good" });
      setEditing(null);
      setCreating(false);
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка сохранения", tone: "critical" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Удалить ${id}?`)) return;
    try {
      await deleteWarehouse(id, token);
      setToast({ message: "Удалено", tone: "good" });
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка удаления", tone: "critical" });
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionHeading eyebrow={`Источник: ${sources.warehouses === "live" ? "backend" : sources.warehouses}`} title={`Склады (${warehouses.length})`} />
        <div className="flex items-center gap-3">
          {toast && <Toast {...toast} />}
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-4 py-2"
            style={{ background: "var(--gradient-fresh)", color: "white", boxShadow: "var(--shadow-sm)" }}
          >
            <Plus size={14} strokeWidth={2.4} /> Добавить склад
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <WarehouseForm
          initial={editing ?? emptyWarehouse()}
          isNew={!editing}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(w) => handleSave(w, !editing)}
        />
      )}

      <Card padded={false}>
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>ID</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Название</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Страна</th>
                <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Сток / ёмкость</th>
                <th className="text-right px-4 py-3" style={{ color: "var(--text-muted)" }}></th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w, i) => (
                <tr key={w.warehouse_id} style={{ borderBottom: i < warehouses.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{w.warehouse_id}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>{w.name}</td>
                  <td className="px-4 py-2.5"><Pill tone={w.country === "KG" ? "orange" : "blue"}>{w.country}</Pill></td>
                  <td className="px-4 py-2.5 tabular" style={{ color: "var(--text-secondary)" }}>{fmtNum(w.current_stock_units)} / {fmtNum(w.capacity_units)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(w)} className="w-7 h-7 rounded-lg grid place-items-center" style={{ color: "var(--series-1)", background: "var(--surface-2)" }}>
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>
                      <button onClick={() => handleDelete(w.warehouse_id)} className="w-7 h-7 rounded-lg grid place-items-center" style={{ color: "var(--status-critical)", background: "var(--surface-2)" }}>
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function WarehouseForm({ initial, isNew, onSave, onCancel }: { initial: Warehouse; isNew: boolean; onSave: (w: Warehouse) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Warehouse>(initial);
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{isNew ? "Новый склад" : `Редактирование ${form.warehouse_id}`}</h3>
        <button onClick={onCancel} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>ID</span>
          <input
            disabled={!isNew}
            value={form.warehouse_id}
            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm col-span-2">
          <span style={{ color: "var(--text-secondary)" }}>Название</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Регион</span>
          <input
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <SelectField label="Страна" value={form.country} onChange={(v) => setForm({ ...form, country: v as Warehouse["country"] })} options={[{ value: "KG", label: "Кыргызстан" }, { value: "RU", label: "Россия" }]} />
        <SelectField
          label="Роль"
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v as Warehouse["role"] })}
          options={[
            { value: "supplier", label: "Supplier" },
            { value: "consolidation", label: "Consolidation" },
            { value: "fulfillment", label: "Fulfillment" },
            { value: "wb_sc", label: "WB SC" },
          ]}
        />
        <NumberField label="Ёмкость, ед." value={form.capacity_units} onChange={(v) => setForm({ ...form, capacity_units: v })} />
        <NumberField label="Текущий сток, ед." value={form.current_stock_units} onChange={(v) => setForm({ ...form, current_stock_units: v })} />
        <NumberField label="Коэфф. логистики" value={form.logistics_coefficient} onChange={(v) => setForm({ ...form, logistics_coefficient: v })} step={0.01} />
        <NumberField label="Хранение, ₽/ед/день" value={form.storage_cost_per_unit_day} onChange={(v) => setForm({ ...form, storage_cost_per_unit_day: v })} step={0.01} />
        <NumberField label="Demand share (0-1)" value={form.demand_share} onChange={(v) => setForm({ ...form, demand_share: v })} step={0.01} />
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={!form.warehouse_id || !form.name}
        className="mt-4 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 disabled:opacity-40"
        style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
      >
        Сохранить
      </button>
    </Card>
  );
}

function TariffsTab({ token }: { token: string }) {
  const { wbTariffs, cargoTariffs, sources, refetch } = useDataStore();
  const [wbForm, setWbForm] = useState(wbTariffs);
  const [cargoForm, setCargoForm] = useState(cargoTariffs);
  const [toast, setToast] = useState<{ message: string; tone: "good" | "critical" } | null>(null);

  async function saveWb() {
    try {
      await updateTariffs("wb", wbForm, token);
      setToast({ message: "Тарифы WB сохранены", tone: "good" });
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка", tone: "critical" });
    }
  }

  async function saveCargo() {
    try {
      await updateTariffs("cargo", cargoForm, token);
      setToast({ message: "Cargo-тарифы сохранены", tone: "good" });
      refetch();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Ошибка", tone: "critical" });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionHeading eyebrow={`Источник: ${sources.tariffs === "live" ? "backend" : sources.tariffs}`} title="Тарифы" />
        {toast && <Toast {...toast} />}
      </div>

      <Card>
        <CardTitle>WB — базовые параметры</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField label="База, ₽" value={wbForm.logistics_base_rub} onChange={(v) => setWbForm({ ...wbForm, logistics_base_rub: v })} />
          <NumberField label="₽ / литр" value={wbForm.logistics_per_liter_rub} onChange={(v) => setWbForm({ ...wbForm, logistics_per_liter_rub: v })} />
          <NumberField label="Хранение ₽/ед/день" value={wbForm.storage_per_unit_day_rub} onChange={(v) => setWbForm({ ...wbForm, storage_per_unit_day_rub: v })} step={0.01} />
          <NumberField label="Бесплатных дней хранения" value={wbForm.storage_free_days} onChange={(v) => setWbForm({ ...wbForm, storage_free_days: v })} />
          <NumberField label="Комиссия (0-1)" value={wbForm.commission_rate} onChange={(v) => setWbForm({ ...wbForm, commission_rate: v })} step={0.01} />
          <NumberField label="Возврат, ₽" value={wbForm.return_logistics_rub} onChange={(v) => setWbForm({ ...wbForm, return_logistics_rub: v })} />
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Объёмные диапазоны</div>
          <div className="flex flex-col gap-2">
            {wbForm.volume_brackets.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0" style={{ color: "var(--text-secondary)" }}>{b.label}</span>
                <NumberField
                  label="Коэффициент"
                  value={b.coefficient}
                  step={0.1}
                  onChange={(v) => {
                    const next = [...wbForm.volume_brackets];
                    next[i] = { ...b, coefficient: v };
                    setWbForm({ ...wbForm, volume_brackets: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <button onClick={saveWb} className="mt-4 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5" style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}>
          Сохранить WB-тарифы
        </button>
      </Card>

      <Card>
        <CardTitle>Cargo (KG → RU)</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <NumberField label="Таможня, ₽/партия" value={cargoForm.customs_and_documentation_per_shipment_rub} onChange={(v) => setCargoForm({ ...cargoForm, customs_and_documentation_per_shipment_rub: v })} />
          <NumberField label="Брокер, ₽/партия" value={cargoForm.broker_fee_per_shipment_rub} onChange={(v) => setCargoForm({ ...cargoForm, broker_fee_per_shipment_rub: v })} />
          <NumberField label="Потери, % от стоимости" value={cargoForm.loss_and_damage_rate} step={0.001} onChange={(v) => setCargoForm({ ...cargoForm, loss_and_damage_rate: v })} />
          <NumberField label="Вместимость фуры, м³" value={cargoForm.truck_capacity_m3} onChange={(v) => setCargoForm({ ...cargoForm, truck_capacity_m3: v })} />
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Способы перевозки</div>
        <div className="flex flex-col gap-2">
          {Object.entries(cargoForm.modes).map(([mode, rate]) => (
            <div key={mode} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end rounded-lg p-2" style={{ background: "var(--surface-2)" }}>
              <span className="text-sm font-medium self-center" style={{ color: "var(--text-primary)" }}>{mode}</span>
              <NumberField
                label="₽/кг"
                value={rate.cost_per_kg_rub}
                onChange={(v) => setCargoForm({ ...cargoForm, modes: { ...cargoForm.modes, [mode]: { ...rate, cost_per_kg_rub: v } } })}
              />
              <NumberField
                label="₽/м³"
                value={rate.cost_per_m3_rub}
                onChange={(v) => setCargoForm({ ...cargoForm, modes: { ...cargoForm.modes, [mode]: { ...rate, cost_per_m3_rub: v } } })}
              />
              <NumberField
                label="Дней в пути (мин)"
                value={rate.min_days}
                onChange={(v) => setCargoForm({ ...cargoForm, modes: { ...cargoForm.modes, [mode]: { ...rate, min_days: v } } })}
              />
            </div>
          ))}
        </div>
        <button onClick={saveCargo} className="mt-4 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5" style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}>
          Сохранить cargo-тарифы
        </button>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <RefreshCcw size={13} strokeWidth={2.4} style={{ color: "var(--text-muted)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Изменения здесь пишутся в базу и сразу видны во всех калькуляторах, которые используют живые тарифы
            (Модуль 05, Cargo-модуль). Значения по-прежнему учебные — см. <code>/roadmap</code>.
          </p>
        </div>
      </Card>
    </section>
  );
}
