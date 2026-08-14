// Rule-based FBS/FBW decision engine (§14 / §17 of the spec). Transparent,
// weighted scoring rather than a black box — every point is explainable.
import type { FulfillmentModel } from "../data/types";

export interface DecisionEngineInput {
  salesVelocity: number; // units/day
  returnRatePct: number; // 0..100
  marginPct: number; // 0..100
  packageVolumeLiters: number;
  demandConcentrationPct: number; // 0..100, share of demand in the single largest region
  stockTurnover: number; // times/year
  warehouseCostShare: number; // 0..100, storage+fulfillment as % of price
}

export interface DecisionEngineResult {
  recommendation: FulfillmentModel | "Hybrid";
  fbwScore: number;
  fbsScore: number;
  reasons: string[];
  risks: string[];
  expectedEffect: string;
}

export function recommendFulfillmentModel(input: DecisionEngineInput): DecisionEngineResult {
  let fbwScore = 0;
  let fbsScore = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (input.salesVelocity >= 25) {
    fbwScore += 3;
    reasons.push("Высокая скорость продаж (≥25 шт/день) снижает риск затоваривания на складе WB.");
  } else if (input.salesVelocity <= 8) {
    fbsScore += 3;
    reasons.push("Низкая скорость продаж (≤8 шт/день) делает предварительный сток на WB рискованным.");
  } else {
    fbwScore += 1;
    fbsScore += 1;
  }

  if (input.returnRatePct <= 12) {
    fbwScore += 2;
    reasons.push("Низкий return rate (≤12%) не создаёт лишней нагрузки на обратную логистику FBW.");
  } else if (input.returnRatePct >= 25) {
    fbsScore += 3;
    reasons.push("Высокий return rate (≥25%) — каждый возврат при FBW дороже и медленнее возвращается в продажу.");
    risks.push("При FBW высокий return rate может обернуться накоплением повреждённого/неликвидного стока на складе WB.");
  }

  if (input.packageVolumeLiters <= 3) {
    fbwScore += 1;
    reasons.push("Компактная упаковка — ниже стоимость хранения на складе WB.");
  } else if (input.packageVolumeLiters >= 12) {
    fbsScore += 1;
    reasons.push("Крупная упаковка делает длительное хранение на складе WB дорогим.");
  }

  if (input.demandConcentrationPct >= 60) {
    fbwScore += 1;
    reasons.push("Спрос сконцентрирован в одном регионе — легко прогнозировать нужный склад WB.");
  } else if (input.demandConcentrationPct <= 30) {
    risks.push("Размытый географически спрос усложняет прогноз, на каком складе WB держать сток.");
  }

  if (input.stockTurnover >= 8) {
    fbwScore += 2;
    reasons.push("Высокая оборачиваемость (≥8 раз/год) — товар не залёживается, капитал не замораживается надолго.");
  } else if (input.stockTurnover <= 3) {
    fbsScore += 2;
    reasons.push("Низкая оборачиваемость (≤3 раза/год) — предоплаченный сток на WB будет долго связывать капитал.");
  }

  if (input.warehouseCostShare >= 12) {
    fbsScore += 2;
    reasons.push("Складские расходы съедают заметную долю цены — стоит пересмотреть объём предварительного стока.");
  }

  if (input.marginPct <= 15) {
    risks.push("Низкая маржа снижает запас прочности при любой модели — ошибка в прогнозе спроса особенно болезненна.");
  }

  const diff = fbwScore - fbsScore;
  let recommendation: FulfillmentModel | "Hybrid";
  if (diff >= 3) recommendation = "FBW";
  else if (diff <= -3) recommendation = "FBS";
  else recommendation = "Hybrid";

  const expectedEffect =
    recommendation === "FBW"
      ? "Ожидаемый эффект: более быстрая доставка клиенту и ниже cost per order, при условии, что прогноз спроса подтвердится."
      : recommendation === "FBS"
      ? "Ожидаемый эффект: меньше замороженного капитала и ниже риск неликвида, но выше требования к операционной дисциплине сборки заказов."
      : "Ожидаемый эффект: разумно тестировать небольшую долю стока на FBW (топ-регион), остальное держать на FBS, и пересматривать через 4–6 недель по факту данных.";

  return { recommendation, fbwScore, fbsScore, reasons, risks, expectedEffect };
}
