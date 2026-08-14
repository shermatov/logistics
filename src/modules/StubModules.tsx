import { StubModulePage } from "../components/lesson/ModulePage";
import { moduleById } from "../data/moduleMeta";

function stub(id: string, outline: string[]) {
  const meta = moduleById(id)!;
  return (
    <StubModulePage
      moduleId={meta.id}
      number={meta.number}
      title={meta.title}
      level={meta.level}
      description={meta.description}
      outline={outline}
    />
  );
}

export const M09Localization = () =>
  stub("m09", [
    "Demand geography vs inventory geography — почему это разные карты",
    "Пример: Москва 40% / Центр 25% / СПб 10% / Поволжье 10% / Урал 8% / Сибирь 7%",
    "Scenario A: 90% stock в одном складе — что происходит со скоростью и стоимостью доставки",
    "Scenario B: stock распределён по спросу — сравнение economics",
    "Калькулятор mismatch score (formulas.allocationMismatchScore) уже используется в Модуле 08 — здесь разберём его отдельно для локализации",
    "Quiz + Manager Question по перераспределению стока при сдвиге спроса",
  ]);

export const M10Returns = () =>
  stub("m10", [
    "Order → Delivery → Purchase vs Order → Delivery → Return",
    "Return rate, причины возврата, especially для fashion: size mismatch, fit, quality, expectation mismatch",
    "Калькулятор: Return Rate → Additional Logistics Cost → Impact on Contribution (formulas.returnCostImpact, logisticsCostPerSuccessfulSale уже в движке)",
    "Reverse logistics: inspection → restock / quarantine / disposal",
    "Case: рост return rate с 15% до 25% — что происходит с прибылью",
  ]);

export const M11FbsOps = () =>
  stub("m11", [
    "Order received → processing → picking → packing → labeling → handover → WB acceptance → sorting → delivery",
    "Где обычно возникают ошибки на каждом шаге",
    "KPI: order processing time, late shipment rate, cancellation rate, assembly accuracy, orders/employee",
    "Case: как узкое место в picking влияет на late shipment rate",
  ]);

export const M12OwnWarehouse = () =>
  stub("m12", [
    "Warehouse Operating Cost = Rent + Labor + Packaging + Equipment + Utilities + Software + Errors + Returns",
    "Cost per order, cost per unit, cost per employee, orders per hour",
    "Когда собственный fulfillment дешевле аутсорса — и когда наоборот",
    "Калькулятор экономики собственного склада",
  ]);

export const M13Transportation = () =>
  stub("m13", [
    "Supplier → warehouse, warehouse → WB, inter-warehouse movement, return transportation",
    "Fixed vs variable cost, cost per km / kg / m³ / shipment, utilization",
    "FTL vs LTL vs курьер vs 3PL vs fulfillment company — когда что выгодно",
    "Связь с Cargo-модулем (KG → RU): те же принципы, другая граница",
  ]);

export const M16Alerts = () =>
  stub("m16", [
    "Каталог алертов: stockout risk, overstock, рост return rate, рост логистической стоимости, capacity > 85%, задержка FBS-обработки",
    "Формат каждого алерта: Problem → Cause → Impact → Recommended Action",
    "Живая версия части этих алертов уже работает на Дашборде руководителя",
  ]);

export const M17Scenarios = () =>
  stub("m17", [
    "Sales +30% — что происходит с логистикой",
    "Return rate 15% → 25% — что происходит с прибылью",
    "Packaging volume +20% — что происходит со стоимостью логистики",
    "Один склад стал недоступен — что делать",
    "Спрос сместился из Москвы в Сибирь — как перераспределить запасы",
    "FBS дороже FBW — стоит ли мигрировать инвентарь",
  ]);

export const M18Crisis = () =>
  stub("m18", [
    "Кейсы: закрытие склада, задержка поставки, stockout, транспортный сбой, рост тарифов, всплеск/падение спроса, волна возвратов",
    "Формат разбора: Identify → Estimate impact → Prioritize actions → Short-term → Medium-term → Long-term prevention",
  ]);

export const M19Strategy = () =>
  stub("m19", [
    "Centralized vs Distributed Inventory",
    "FBS vs FBW, Own Warehouse vs 3PL, High Stock vs Lean Stock, Fast delivery vs Low cost",
    "Decision = Objective + Constraints + Economics + Risk — без единственно верного ответа",
  ]);

export const M20SystemMap = () =>
  stub("m20", [
    "INPUTS: Demand, Inventory, Orders, Returns, Warehouse capacity, Tariffs, Transportation, Costs",
    "PROCESS: Planning → Allocation → Fulfillment → Transportation → Monitoring → Optimization",
    "OUTPUTS: Delivery, Availability, Cost, Customer Experience, Profit",
    "Главная system map, объединяющая все 20 модулей и cargo-цепочку KG → RU",
  ]);
