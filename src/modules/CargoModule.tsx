import { useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField, SelectField, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { FlowDiagram } from "../components/diagrams/FlowDiagram";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { DecisionCaseBlock, WhyChain } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import {
  calcCargoCost,
  fullyLandedCostPerUnit,
  realContribution,
  totalLeadTime,
  requiredBufferStock,
  calcTruckCapacity,
  daysOfStock,
  stockoutRisk,
  fmtRub,
  fmtNum,
} from "../lib/formulas";
import type { CargoMode } from "../data/types";
import { cargoTariffs } from "../data/tariffs";

const MODE_OPTIONS: { value: CargoMode; label: string }[] = [
  { value: "consolidated_lcl", label: "Сборный груз (LCL)" },
  { value: "partial_truck", label: "Частичная загрузка (partial truck)" },
  { value: "dedicated_truck", label: "Отдельная машина (FTL)" },
  { value: "railway", label: "Железная дорога" },
  { value: "3pl", label: "3PL-оператор" },
];

const risks: { risk: string; probability: string; impact: string; signal: string; mitigation: string; contingency: string }[] = [
  {
    risk: "Задержка на границе / таможне",
    probability: "Средняя",
    impact: "Срыв даты поступления на склад РФ, риск stockout на WB",
    signal: "Рост очереди на погранпереходе, изменение регламента оформления",
    mitigation: "Буферные дни в lead time (border_days), заранее готовые документы",
    contingency: "Экстренная докупка/переброска между российскими складами",
  },
  {
    risk: "Повреждение или порча груза в пути",
    probability: "Низкая-средняя",
    impact: "Прямая потеря стоимости товара, недопоставка под план",
    signal: "История повреждений у конкретного перевозчика",
    mitigation: "Страхование груза, качественная упаковка, проверенный перевозчик",
    contingency: "Резервный сток в России сверх стандартного safety stock",
  },
  {
    risk: "Ошибка в количестве при приёмке",
    probability: "Средняя",
    impact: "Расхождение учёта, ложный stockout или overstock в системе",
    signal: "Регулярные расхождения при приёмке у конкретного склада",
    mitigation: "Пересчёт при погрузке в КР и повторная проверка при приёмке в РФ",
    contingency: "Регулярные сверки остатков, буфер на расхождения",
  },
  {
    risk: "Рост стоимости перевозки / изменение тарифов",
    probability: "Средняя-высокая",
    impact: "Рост fully landed cost, падение contribution margin",
    signal: "Сезонные колебания спроса на грузоперевозки, изменение курса валют",
    mitigation: "Договоры с фиксацией тарифа на период, работа с 2+ перевозчиками",
    contingency: "Пересмотр цены продажи или консолидация в более крупные партии",
  },
  {
    risk: "Изменение таможенных правил / документации",
    probability: "Низкая-средняя",
    impact: "Задержка оформления, штрафы, срыв графика поставок",
    signal: "Официальные уведомления таможенных органов, изменения у брокера",
    mitigation: "Работа с брокером, который заранее отслеживает изменения регламента",
    contingency: "Пауза отгрузок до уточнения правил, юридическая консультация",
  },
];

const quizQuestions = [
  {
    question: "Почему fully landed cost — более важный показатель для принятия решений, чем 'стоимость доставки'?",
    options: [
      "Потому что доставка — это единственная статья расходов",
      "Потому что fully landed cost включает все расходы от себестоимости товара до готовности к продаже на складе в России, показывая реальную себестоимость единицы",
      "Потому что доставка не влияет на прибыль",
      "Это одно и то же, просто разные названия",
    ],
    correctIndex: 1,
    explanation: "'Стоимость доставки' — только один компонент. Fully landed cost = product cost + packaging + KG logistics + cross-border cargo + customs + RU logistics + warehouse + fulfillment — только так видна реальная маржа.",
  },
  {
    question: "Почему крупная консолидированная партия обычно снижает cost per unit, но увеличивает риск?",
    options: [
      "Потому что крупные партии всегда едут медленнее",
      "Потому что фиксированные расходы (таможня, брокер, документы) распределяются на больше единиц, но больше капитала замораживается в товаре в пути и на складе",
      "Потому что крупные партии облагаются повышенным налогом",
      "Риск не меняется от размера партии",
    ],
    correctIndex: 1,
    explanation: "Это классический trade-off Transportation Efficiency vs Inventory Risk — эффективность перевозки растёт с размером партии, но растёт и объём капитала, замороженного в одной поставке.",
  },
];

export function CargoModule() {
  const { recordQuiz } = useProgress();

  // --- Cargo cost calculator state ---
  const [units, setUnits] = useState(2000);
  const [productCostPerUnit, setProductCostPerUnit] = useState(650);
  const [packagingPerUnit, setPackagingPerUnit] = useState(25);
  const [weightPerUnitKg, setWeightPerUnitKg] = useState(0.6);
  const [volumePerUnitM3, setVolumePerUnitM3] = useState(0.006);
  const [mode, setMode] = useState<CargoMode>("consolidated_lcl");
  const [kgLocalTransportTotal, setKgLocalTransportTotal] = useState(15000);
  const [ruInlandDeliveryTotal, setRuInlandDeliveryTotal] = useState(40000);
  const [warehouseFulfillmentTotal, setWarehouseFulfillmentTotal] = useState(25000);
  const [insuranceRatePct, setInsuranceRatePct] = useState(0.3);
  const [sellingPrice, setSellingPrice] = useState(1990);
  const [marketplaceCostsPerUnit, setMarketplaceCostsPerUnit] = useState(430);

  const declaredValue = productCostPerUnit * units;
  const cargoResult = calcCargoCost({
    productCostTotal: productCostPerUnit * units,
    packagingTotal: packagingPerUnit * units,
    kyrgyzstanLocalTransport: kgLocalTransportTotal,
    weightKg: weightPerUnitKg * units,
    volumeM3: volumePerUnitM3 * units,
    mode,
    declaredValue,
    russiaInlandDelivery: ruInlandDeliveryTotal,
    warehouseAndFulfillment: warehouseFulfillmentTotal,
    insuranceRate: insuranceRatePct / 100,
  });

  const costPerUnit = cargoResult.totalCargoCost / units;
  const costPerKg = cargoResult.totalCargoCost / (weightPerUnitKg * units);
  const costPerM3 = cargoResult.totalCargoCost / (volumePerUnitM3 * units);

  const flc = fullyLandedCostPerUnit({
    productCostPerUnit,
    packagingPerUnit,
    kyrgyzstanLogisticsPerUnit: kgLocalTransportTotal / units,
    crossBorderCargoPerUnit: cargoResult.breakdown.cross_border_freight / units,
    customsPerUnit: (cargoResult.breakdown.customs_and_documentation + cargoResult.breakdown.broker_fee) / units,
    russiaLogisticsPerUnit: ruInlandDeliveryTotal / units,
    warehousePerUnit: warehouseFulfillmentTotal / units,
    fulfillmentPerUnit: 0,
  });
  const contribution = realContribution(sellingPrice, marketplaceCostsPerUnit, flc);

  // --- Lead time planner ---
  const [productionDays, setProductionDays] = useState(10);
  const [dailySalesPlanning, setDailySalesPlanning] = useState(180);
  const [safetyStockPlanning, setSafetyStockPlanning] = useState(600);
  const leadTime = totalLeadTime({
    productionDays,
    cargoTransitDays: cargoResult.transitDaysRange[1],
    borderCustomsDays: cargoTariffs.border_days_max,
    warehouseProcessingDays: 2,
  });
  const buffer = requiredBufferStock(dailySalesPlanning, leadTime, safetyStockPlanning);

  // --- Truck capacity calculator ---
  const [tLength, setTLength] = useState(35);
  const [tWidth, setTWidth] = useState(25);
  const [tHeight, setTHeight] = useState(15);
  const [tWeight, setTWeight] = useState(0.6);
  const [tQuantity, setTQuantity] = useState(4000);
  const capacity = calcTruckCapacity({
    unitLengthCm: tLength,
    unitWidthCm: tWidth,
    unitHeightCm: tHeight,
    unitWeightKg: tWeight,
    quantity: tQuantity,
  });

  // --- Cargo decision scenario (§43.13) ---
  const [kgStock, setKgStock] = useState(5000);
  const [ruStock, setRuStock] = useState(1500);
  const [dailySalesScenario, setDailySalesScenario] = useState(180);
  const [leadTimeScenario, setLeadTimeScenario] = useState(18);
  const ruDaysOfStock = daysOfStock(ruStock, dailySalesScenario);
  const risk = stockoutRisk(ruDaysOfStock, leadTimeScenario);
  const requiredDuringLeadTime = dailySalesScenario * leadTimeScenario;
  const gap = Math.max(0, requiredDuringLeadTime - ruStock);
  const recommendedShipment = Math.min(kgStock, Math.round(gap + dailySalesScenario * 20));

  return (
    <ModulePage
      moduleId="cargo"
      number="21"
      title="Cargo Logistics: Кыргызстан → Россия"
      level="Director"
      intro="Товар из Кыргызстана должен физически попасть в Россию прежде, чем он вообще станет доступен на Wildberries. Это отдельное звено цепочки со своей экономикой, своими рисками и своим планированием — и оно должно управляться как единая система вместе с WB-логистикой, а не отдельно от неё."
    >
      <section>
        <SectionHeading eyebrow="Visual" title="Полный поток: от поставщика в Кыргызстане до клиента и обратно" />
        <Card>
          <FlowDiagram
            steps={[
              { title: "Supplier / Factory", subtitle: "Кыргызстан", tone: "blue" },
              { title: "Local warehouse", subtitle: "Приёмка в КР", tone: "blue" },
              { title: "Consolidation", subtitle: "Формирование партии", tone: "blue" },
              { title: "Documentation", subtitle: "Документы, декларация", tone: "violet" },
              { title: "Border / Customs", subtitle: "Таможня", tone: "violet" },
              { title: "Transportation", subtitle: "Международная перевозка", tone: "aqua" },
              { title: "RU warehouse / 3PL", subtitle: "Приёмка в России", tone: "aqua" },
              { title: "Wildberries", subtitle: "FBS / FBW", tone: "orange" },
              { title: "Customer", subtitle: "Клиент", tone: "orange" },
              { title: "Return", subtitle: "Возврат", tone: "red" },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Concept" title="Способы перевозки — когда что выгодно" />
        <Card padded={false}>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Способ</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>₽/кг</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>₽/м³</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Срок в пути</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Когда выгодно</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "consolidated_lcl" as CargoMode, when: "Небольшие и нерегулярные партии, тестовые поставки нового SKU" },
                  { key: "partial_truck" as CargoMode, when: "Средний объём, не хватает на полную машину, но регулярно" },
                  { key: "dedicated_truck" as CargoMode, when: "Большой стабильный объём — минимальная цена за кг/м³" },
                  { key: "railway" as CargoMode, when: "Очень большие объёмы, есть запас времени, нужна низкая цена" },
                  { key: "3pl" as CargoMode, when: "Нужна перевозка 'под ключ' с ответственностью оператора за весь путь" },
                ].map(({ key, when }) => {
                  const t = cargoTariffs.modes[key];
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid var(--gridline)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                        {MODE_OPTIONS.find((m) => m.value === key)!.label}
                      </td>
                      <td className="px-4 py-3 tabular" style={{ color: "var(--text-secondary)" }}>{t.cost_per_kg_rub} ₽</td>
                      <td className="px-4 py-3 tabular" style={{ color: "var(--text-secondary)" }}>{t.cost_per_m3_rub.toLocaleString("ru-RU")} ₽</td>
                      <td className="px-4 py-3 tabular" style={{ color: "var(--text-secondary)" }}>{t.min_days}–{t.max_days} дн</td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{when}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs px-4 py-3" style={{ color: "var(--text-muted)" }}>
            Тарифы — учебная модель ({cargoTariffs.as_of_date}), не реальные ставки перевозчиков. {cargoTariffs.source_note}
          </p>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Калькулятор стоимости партии (Cargo Cost)" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Количество единиц в партии" value={units} onChange={setUnits} />
              <NumberField label="Себестоимость / ед., ₽" value={productCostPerUnit} onChange={setProductCostPerUnit} />
              <NumberField label="Упаковка / ед., ₽" value={packagingPerUnit} onChange={setPackagingPerUnit} />
              <NumberField label="Вес / ед., кг" value={weightPerUnitKg} onChange={setWeightPerUnitKg} step={0.05} />
              <NumberField label="Объём / ед., м³" value={volumePerUnitM3} onChange={setVolumePerUnitM3} step={0.001} />
              <div className="col-span-2">
                <SelectField label="Способ перевозки" value={mode} onChange={setMode} options={MODE_OPTIONS} />
              </div>
              <NumberField label="Транспорт по КР, ₽ (партия)" value={kgLocalTransportTotal} onChange={setKgLocalTransportTotal} />
              <NumberField label="Доставка по РФ, ₽ (партия)" value={ruInlandDeliveryTotal} onChange={setRuInlandDeliveryTotal} />
              <NumberField label="Склад + fulfillment, ₽ (партия)" value={warehouseFulfillmentTotal} onChange={setWarehouseFulfillmentTotal} />
              <NumberField label="Страхование, % от стоимости груза" value={insuranceRatePct} onChange={setInsuranceRatePct} step={0.1} />
            </div>
            <div>
              <div className="rounded-lg border overflow-hidden mb-3" style={{ borderColor: "var(--border)" }}>
                {Object.entries(cargoResult.breakdown).map(([key, value], i, arr) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-1.5 text-sm"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--gridline)" : undefined }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{breakdownLabel(key)}</span>
                    <span className="tabular" style={{ color: "var(--text-primary)" }}>{fmtRub(value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
                  <span style={{ color: "var(--text-primary)" }}>Итого Total Cargo Cost</span>
                  <span className="tabular" style={{ color: "var(--text-primary)" }}>{fmtRub(cargoResult.totalCargoCost)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <KpiTile label="Cost per unit" value={fmtRub(costPerUnit)} />
                <KpiTile label="Cost per kg" value={fmtRub(costPerKg)} />
                <KpiTile label="Cost per m³" value={fmtRub(costPerM3)} />
                <KpiTile label="Транзит + граница" value={`${cargoResult.transitDaysRange[0]}–${cargoResult.transitDaysRange[1]} дн`} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Fully Landed Cost и реальная маржа" subtitle="Реальная себестоимость единицы товара, когда он уже в России и готов к продаже." />
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Цена продажи, ₽" value={sellingPrice} onChange={setSellingPrice} />
              <NumberField label="Расходы маркетплейса / ед., ₽" value={marketplaceCostsPerUnit} onChange={setMarketplaceCostsPerUnit} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiTile label="Fully Landed Cost" value={fmtRub(flc)} sub="себестоимость + вся логистика KG→RU + склад" />
              <KpiTile
                label="Real Contribution"
                value={fmtRub(contribution)}
                status={contribution > sellingPrice * 0.15 ? "good" : contribution > 0 ? "warning" : "critical"}
              />
            </div>
          </div>
          <p className="text-xs mt-4 rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            Fully Landed Cost = Product Cost + Packaging + Kyrgyzstan Logistics + Cross-Border Cargo + Customs/Docs +
            Russia Logistics + Warehouse. Real Contribution = Selling Price − Marketplace Costs − Fully Landed Cost.
          </p>
        </Card>
      </section>

      <WhyChain
        steps={[
          "Считаем только 'стоимость доставки', игнорируя таможню, брокера и склад",
          "Fully landed cost занижен на бумаге",
          "Цена продажи устанавливается исходя из заниженной себестоимости",
          "Реальная contribution margin оказывается ниже плановой",
          "Прибыль 'теряется' в местах, которые никто не считал по отдельности",
        ]}
      />

      <section>
        <SectionHeading eyebrow="Calculation" title="Планирование поставки: Lead Time и буферный запас" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Производство/закупка, дней" value={productionDays} onChange={setProductionDays} />
              <NumberField label="Продажи, шт/день" value={dailySalesPlanning} onChange={setDailySalesPlanning} />
              <NumberField label="Safety stock, шт" value={safetyStockPlanning} onChange={setSafetyStockPlanning} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiTile label="Cargo transit" value={`${cargoResult.transitDaysRange[1]} дн`} sub="для выбранного способа перевозки" />
              <KpiTile label="Total Lead Time" value={`${fmtNum(leadTime)} дн`} sub="производство + транзит + граница + приёмка" />
              <KpiTile label="Требуемый буфер" value={`${fmtNum(buffer)} шт`} sub="покрывает продажи на весь lead time + safety stock" />
              <KpiTile label="Капитал в буфере" value={fmtRub(buffer * productCostPerUnit)} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Calculation" title="Загрузка машины (Truck Capacity)" />
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Длина коробки, см" value={tLength} onChange={setTLength} />
              <NumberField label="Ширина коробки, см" value={tWidth} onChange={setTWidth} />
              <NumberField label="Высота коробки, см" value={tHeight} onChange={setTHeight} />
              <NumberField label="Вес коробки, кг" value={tWeight} onChange={setTWeight} step={0.1} />
              <NumberField label="Количество коробок" value={tQuantity} onChange={setTQuantity} />
            </div>
            <div className="flex flex-col gap-3 justify-center">
              <UtilBar label="Объём" pct={capacity.volumeUtilizationPct} />
              <UtilBar label="Вес" pct={capacity.weightUtilizationPct} />
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Ограничивающий фактор: <strong>{capacity.limitingFactor === "volume" ? "объём" : "вес"}</strong>.
                Максимум коробок в стандартную фуру (82 м³ / 20 т): {fmtNum(capacity.maxUnitsThatFit)} шт. Свободно
                ещё {fmtNum(Math.min(capacity.remainingUnitsByVolume, capacity.remainingUnitsByWeight))} коробок.
              </div>
            </div>
          </div>
        </Card>
      </section>

      <DecisionCaseBlock
        title="Cargo Decision Engine — когда и сколько отправлять"
        fields={{
          situation: (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <NumberField label="Сток в Кыргызстане, шт" value={kgStock} onChange={setKgStock} />
              <NumberField label="Сток в России, шт" value={ruStock} onChange={setRuStock} />
              <NumberField label="Продажи, шт/день" value={dailySalesScenario} onChange={setDailySalesScenario} />
              <NumberField label="Lead time, дней" value={leadTimeScenario} onChange={setLeadTimeScenario} />
            </div>
          ),
          data: `Days of stock в России: ${fmtNum(ruDaysOfStock, 1)} дн при lead time ${leadTimeScenario} дн — российского стока хватает на меньше половины пути новой партии, если цифры близки.`,
          problem: gap > 0 ? `Дефицит на время lead time: не хватает ${fmtNum(gap)} шт, чтобы дотянуть до прибытия новой партии.` : "Текущего стока в России достаточно на весь lead time — отправка не срочная.",
          options: "(1) Отправить минимальную партию для покрытия дефицита; (2) отправить крупную партию для снижения cost per unit; (3) задержать отправку и рискнуть stockout.",
          economics: "Крупная партия снижает cost per unit (фиксированные расходы делятся на больше единиц), но замораживает больше капитала и требует больше свободного места на складе в России.",
          risk: risk === "high" ? "Высокий риск stockout — задержка отправки может стоить упущенных продаж и падения рейтинга SKU." : risk === "medium" ? "Средний риск — есть время подготовить оптимальную по размеру партию." : "Низкий риск — можно спокойно консолидировать более крупную и выгодную партию.",
          decision: `Рекомендуемый размер отправки: ${fmtNum(recommendedShipment)} шт (закрывает дефицит + буфер на ~20 дней продаж, ограничено доступным стоком в КР: ${fmtNum(kgStock)} шт).`,
          expectedResult: "После отправки — пересчитать days of stock в России и держать под наблюдением до подтверждения прибытия партии на склад.",
        }}
      />

      <section>
        <SectionHeading eyebrow="Risk management" title="Cross-Border риски" />
        <div className="flex flex-col gap-3">
          {risks.map((r) => (
            <Card key={r.risk}>
              <CardTitle>{r.risk}</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Вероятность: </span><span style={{ color: "var(--text-secondary)" }}>{r.probability}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Влияние: </span><span style={{ color: "var(--text-secondary)" }}>{r.impact}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Ранний сигнал: </span><span style={{ color: "var(--text-secondary)" }}>{r.signal}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Митигация: </span><span style={{ color: "var(--text-secondary)" }}>{r.mitigation}</span></div>
                <div className="md:col-span-2"><span className="font-medium" style={{ color: "var(--text-primary)" }}>План Б: </span><span style={{ color: "var(--text-secondary)" }}>{r.contingency}</span></div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardTitle>Единая цепочка, а не два процесса <Pill tone="blue">Продукт + Информация + Деньги + Риск</Pill></CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Cargo-планирование из Кыргызстана и управление стоком на Wildberries — это одна система: прогноз продаж
          на WB определяет, когда и сколько нужно отправить груза; cargo lead time определяет, какой safety stock
          нужен в России уже сегодня. Разделять эти два процесса — значит терять видимость и принимать решения по
          неполным данным.
        </p>
      </Card>

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("cargo", score, total)} />
    </ModulePage>
  );
}

function breakdownLabel(key: string): string {
  const labels: Record<string, string> = {
    product_cost: "Себестоимость товара",
    packaging: "Упаковка",
    kyrgyzstan_local_transport: "Транспорт по Кыргызстану",
    cross_border_freight: "Международная перевозка",
    customs_and_documentation: "Таможня и документы",
    broker_fee: "Брокер",
    russia_inland_delivery: "Доставка по России",
    warehouse_and_fulfillment: "Склад и fulfillment",
    insurance: "Страхование",
    losses_and_damage: "Потери / повреждения",
    other: "Прочее",
  };
  return labels[key] ?? key;
}

function UtilBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.min(100, pct);
  const over = pct > 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="tabular" style={{ color: over ? "var(--status-critical)" : "var(--text-primary)" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--gridline)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, background: over ? "var(--status-critical)" : "var(--series-1)" }}
        />
      </div>
    </div>
  );
}
