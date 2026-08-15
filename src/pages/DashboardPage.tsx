import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LayoutDashboard, AlertTriangle } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { SectionHeading, StatusDot } from "../components/ui/Misc";
import { returnReasonBreakdown } from "../data/sampleData";
import { useDataStore } from "../state/dataStore";
import { calcUnitEconomics, daysOfStock, fmtRub, fmtPct, fmtNum } from "../lib/formulas";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

interface Alert {
  level: "critical" | "warning";
  problem: string;
  cause: string;
  impact: string;
  action: string;
}

export function DashboardPage() {
  const { skus, warehouses, dailyHistory } = useDataStore();
  const last7 = dailyHistory.slice(-7);
  const prev7 = dailyHistory.slice(-14, -7);
  const last30 = dailyHistory;

  const totalOrders = sum(last30.map((d) => d.orders));
  const totalRevenue = sum(last30.map((d) => d.revenue));
  const totalLogisticsCost = sum(last30.map((d) => d.logisticsCost));
  const totalReturns = sum(last30.map((d) => d.returns));
  const totalReturnCost = sum(last30.map((d) => d.returnCost));
  const returnRate = totalReturns / totalOrders;
  const logisticsSharePct = totalLogisticsCost / totalRevenue;

  const avgProductCost = sum(skus.map((s) => s.product_cost)) / skus.length;
  const avgSellingPrice = sum(skus.map((s) => s.selling_price)) / skus.length;
  const avgLogisticsPerOrder = totalLogisticsCost / totalOrders;

  const unitEcon = calcUnitEconomics({
    sellingPrice: avgSellingPrice,
    productCost: avgProductCost,
    packagingCost: 25,
    logisticsCost: avgLogisticsPerOrder,
    storageCost: 15,
    acceptanceCost: 10,
    returnCostAllocated: returnRate * (totalReturnCost / totalReturns || 0),
    advertisingCost: 60,
    fulfillmentCost: 30,
    commissionRate: 0.19,
    taxRate: 0.06,
  });

  const stockRu = last30[last30.length - 1].stockRu;
  const stockKg = last30[last30.length - 1].stockKg;
  const avgDailyOrders = totalOrders / 30;
  const daysOfStockRu = daysOfStock(stockRu, avgDailyOrders);

  const returnRateLast7 = sum(last7.map((d) => d.returns)) / sum(last7.map((d) => d.orders));
  const returnRatePrev7 = sum(prev7.map((d) => d.returns)) / sum(prev7.map((d) => d.orders));

  const logisticsShareLast7 = sum(last7.map((d) => d.logisticsCost)) / sum(last7.map((d) => d.revenue));
  const logisticsSharePrev7 = sum(prev7.map((d) => d.logisticsCost)) / sum(prev7.map((d) => d.revenue));

  const busyWarehouses = warehouses.filter((w) => w.current_stock_units / w.capacity_units > 0.75);

  const alerts: Alert[] = useMemo(() => {
    const list: Alert[] = [];
    if (daysOfStockRu < 14) {
      list.push({
        level: daysOfStockRu < 8 ? "critical" : "warning",
        problem: `Stockout risk: остатка в России хватит на ${daysOfStockRu.toFixed(1)} дн`,
        cause: "Текущий сток в России ниже, чем требует lead time новой поставки из Кыргызстана",
        impact: "Риск отсутствия товара в наличии, падение продаж и рейтинга SKU",
        action: "Ускорить отправку следующей cargo-партии (Модуль 21) и проверить reorder point",
      });
    }
    warehouses.forEach((w) => {
      const util = w.current_stock_units / w.capacity_units;
      if (util > 0.85) {
        list.push({
          level: "critical",
          problem: `${w.name}: загрузка склада ${(util * 100).toFixed(0)}%`,
          cause: "Поступления превышают темп отгрузки на данном складе",
          impact: "Риск отказа в приёмке новых поставок, рост стоимости хранения",
          action: "Перераспределить сток на менее загруженные склады (Модуль 08)",
        });
      } else if (util > 0.75) {
        list.push({
          level: "warning",
          problem: `${w.name}: загрузка склада ${(util * 100).toFixed(0)}%`,
          cause: "Склад приближается к пределу ёмкости",
          impact: "При сохранении темпа — критическая загрузка через 1–2 недели",
          action: "Спланировать перераспределение заранее, не дожидаясь критического уровня",
        });
      }
    });
    if (returnRateLast7 > returnRatePrev7 * 1.1) {
      list.push({
        level: "warning",
        problem: `Return rate вырос: ${(returnRatePrev7 * 100).toFixed(1)}% → ${(returnRateLast7 * 100).toFixed(1)}%`,
        cause: "Рост доли возвратов за последние 7 дней относительно предыдущих 7 дней",
        impact: "Logistics cost per successful sale растёт, contribution margin падает",
        action: "Проверить топ причины возврата (Модуль 10) — размер, брак, несоответствие ожиданиям",
      });
    }
    if (logisticsShareLast7 > logisticsSharePrev7 * 1.08) {
      list.push({
        level: "warning",
        problem: "Логистическая стоимость как % от выручки растёт",
        cause: "Рост объёма упаковки, доли дальних регионов или изменение тарифов",
        impact: "Прямое давление на contribution margin",
        action: "Проверить Модуль 05 (упаковка) и Модуль 09 (локализация) на предмет причины роста",
      });
    }
    return list;
  }, [daysOfStockRu, returnRateLast7, returnRatePrev7, logisticsShareLast7, logisticsSharePrev7]);

  const returnReasonsSorted = [...returnReasonBreakdown].sort((a, b) => b.share - a.share);

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "var(--gradient-fresh)", boxShadow: "var(--shadow-sm)", color: "white" }}
          >
            <LayoutDashboard size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-3)" }}>
              Дашборд руководителя
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upsell — Logistics Control Center
            </h1>
          </div>
        </div>
        <p className="relative text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          Данные за последние 30 дней. Компания и цифры — учебный пример, не реальные показатели.{" "}
          <Link to="/roadmap" className="underline" style={{ color: "var(--series-3)" }}>
            Откуда данные и что дальше →
          </Link>
        </p>
      </div>

      {alerts.length > 0 && (
        <section>
          <SectionHeading eyebrow="Alerts" title="Активные предупреждения" />
          <div className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <Card key={i} className="relative overflow-hidden">
                <span
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: a.level === "critical" ? "var(--status-critical)" : "var(--status-warning)" }}
                  aria-hidden
                />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <StatusDot status={a.level === "critical" ? "critical" : "warning"} />
                    <AlertTriangle size={14} strokeWidth={2.4} style={{ color: a.level === "critical" ? "var(--status-critical)" : "var(--status-warning)" }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {a.problem}
                    </div>
                    <div className="text-xs mt-1 grid grid-cols-1 md:grid-cols-3 gap-2" style={{ color: "var(--text-secondary)" }}>
                      <div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>Причина: </span>
                        {a.cause}
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>Влияние: </span>
                        {a.impact}
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>Действие: </span>
                        {a.action}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading eyebrow="Sales" title="Продажи" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Заказов за 30 дней" value={fmtNum(totalOrders)} />
          <KpiTile label="Выручка" value={fmtRub(totalRevenue)} />
          <KpiTile label="Успешные продажи" value={fmtNum(totalOrders - totalReturns)} sub={`${fmtPct(1 - returnRate)} от заказов`} />
          <KpiTile label="Средний чек" value={fmtRub(totalRevenue / totalOrders)} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardTitle>Заказы в день</CardTitle>
          <div className="viz-root" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--gridline)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--text-primary)" }} />
                <Line type="monotone" dataKey="orders" name="Заказы" stroke="var(--series-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Логистика, % от выручки</CardTitle>
          <div className="viz-root" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={last30.map((d) => ({ date: d.date, share: d.logisticsCost / d.revenue }))}
                margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--gridline)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} minTickGap={30} />
                <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--text-primary)" }} />
                <Line type="monotone" dataKey="share" name="Логистика % от выручки" stroke="var(--series-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Inventory" title="Запасы" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Сток в России" value={fmtNum(stockRu)} sub={`${fmtNum(daysOfStockRu, 1)} дней запаса`} status={daysOfStockRu < 8 ? "critical" : daysOfStockRu < 14 ? "warning" : "good"} />
          <KpiTile label="Сток в Кыргызстане" value={fmtNum(stockKg)} />
          <KpiTile label="Складов у предела ёмкости" value={fmtNum(busyWarehouses.length)} status={busyWarehouses.length > 0 ? "warning" : "good"} />
          <KpiTile label="Средний остаток / SKU" value={fmtNum((stockRu + stockKg) / skus.length)} />
        </div>
      </section>

      <section>
        <Card>
          <CardTitle>Остаток и загрузка по складам</CardTitle>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Склад</th>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Остаток</th>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Ёмкость</th>
                  <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Загрузка</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => {
                  const util = w.current_stock_units / w.capacity_units;
                  return (
                    <tr key={w.warehouse_id} style={{ borderBottom: "1px solid var(--gridline)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{w.name}</td>
                      <td className="px-3 py-2 tabular" style={{ color: "var(--text-secondary)" }}>{fmtNum(w.current_stock_units)}</td>
                      <td className="px-3 py-2 tabular" style={{ color: "var(--text-secondary)" }}>{fmtNum(w.capacity_units)}</td>
                      <td className="px-3 py-2 tabular" style={{ color: util > 0.85 ? "var(--status-critical)" : util > 0.75 ? "var(--status-warning)" : "var(--text-secondary)" }}>
                        {(util * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Returns" title="Возвраты" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid grid-cols-2 gap-3 content-start">
            <KpiTile label="Return rate" value={fmtPct(returnRate)} status={returnRate < 0.15 ? "good" : returnRate < 0.25 ? "warning" : "critical"} />
            <KpiTile label="Стоимость возвратов" value={fmtRub(totalReturnCost)} />
          </div>
          <Card>
            <CardTitle>Причины возвратов</CardTitle>
            <div className="viz-root" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnReasonsSorted} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--gridline)" />
                  <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="reason" width={150} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="share" fill="var(--series-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Financial" title="Финансы" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Contribution margin" value={fmtPct(unitEcon.contributionMarginPct)} status={unitEcon.contributionMarginPct > 0.15 ? "good" : unitEcon.contributionMarginPct > 0.05 ? "warning" : "critical"} />
          <KpiTile label="Логистика, % от выручки" value={fmtPct(logisticsSharePct)} />
          <KpiTile label="Прибыль с усреднённого заказа" value={fmtRub(unitEcon.contribution)} />
          <KpiTile label="Логистика на 30 дней" value={fmtRub(totalLogisticsCost)} />
        </div>
      </section>
    </div>
  );
}
