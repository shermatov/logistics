import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { DecisionCaseBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { daysOfStock, calcUnitEconomics, estimatedLogisticsCostPerUnit, volumeLiters, fmtRub, fmtPct, fmtNum } from "../lib/formulas";

const quizQuestions = [
  {
    question: "Продажи выросли на 30% без изменения остатка. Что произойдёт с days of stock?",
    options: ["Вырастет на 30%", "Не изменится", "Сократится примерно на 23% (1 / 1.3)", "Станет нулевым"],
    correctIndex: 2,
    explanation: "Days of Stock = Inventory / Avg Daily Sales. При росте знаменателя на 30% значение уменьшается до 1/1.3 ≈ 77% от прежнего, то есть сокращается примерно на 23%.",
  },
];

export function M17Scenarios() {
  const { recordQuiz } = useProgress();

  // Scenario 1: sales +30%
  const inventory = 3000;
  const dailySalesBefore = 180;
  const dailySalesAfter = dailySalesBefore * 1.3;
  const dosBefore = daysOfStock(inventory, dailySalesBefore);
  const dosAfter = daysOfStock(inventory, dailySalesAfter);

  // Scenario 2: return rate 15% -> 25%
  const baseInput = {
    sellingPrice: 1990,
    productCost: 650,
    packagingCost: 25,
    logisticsCost: 180,
    storageCost: 15,
    acceptanceCost: 10,
    advertisingCost: 60,
    fulfillmentCost: 35,
    commissionRate: 0.19,
    taxRate: 0.06,
  };
  const econ15 = calcUnitEconomics({ ...baseInput, returnCostAllocated: 0.15 * 220 });
  const econ25 = calcUnitEconomics({ ...baseInput, returnCostAllocated: 0.25 * 220 });

  // Scenario 3: packaging volume +20%
  const l = 30, w = 22, h = 8;
  const litersBefore = volumeLiters(l, w, h);
  const litersAfter = litersBefore * 1.2;
  const costBefore = estimatedLogisticsCostPerUnit(litersBefore);
  const costAfter = estimatedLogisticsCostPerUnit(litersAfter);

  return (
    <ModulePage
      moduleId="m17"
      number="17"
      title="Logistics Analytics Scenarios — аналитические сценарии"
      level="Director"
      intro="Семь ключевых 'что если' сценариев, которые реально встречаются в управлении логистикой. Первые три рассчитаны формулами движка на модельных числах, остальные — разобраны как management reasoning."
    >
      <section>
        <SectionHeading eyebrow="Scenario 1 (calculated)" title="Продажи выросли на 30%. Что происходит с логистикой?" />
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Days of stock до" value={`${fmtNum(dosBefore, 1)} дн`} />
            <KpiTile label="Days of stock после" value={`${fmtNum(dosAfter, 1)} дн`} status={dosAfter < 10 ? "critical" : dosAfter < 14 ? "warning" : "good"} />
            <KpiTile label="Продажи до/после" value={`${dailySalesBefore} → ${fmtNum(dailySalesAfter, 0)}`} />
            <KpiTile label="Сокращение запаса дней" value={fmtPct(1 - dosAfter / dosBefore)} />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
            Без пересмотра reorder point (Модуль 07) склад незаметно приближается к stockout — рост продаж съедает
            запас быстрее, чем кажется на глаз.
          </p>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Scenario 2 (calculated)" title="Return rate вырос с 15% до 25%. Что происходит с прибылью?" />
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Contribution при 15%" value={fmtRub(econ15.contribution)} />
            <KpiTile label="Contribution при 25%" value={fmtRub(econ25.contribution)} status="critical" />
            <KpiTile label="Падение прибыли с продажи" value={fmtRub(econ15.contribution - econ25.contribution)} />
            <KpiTile label="Падение маржи, п.п." value={`${((econ15.contributionMarginPct - econ25.contributionMarginPct) * 100).toFixed(1)} п.п.`} />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Scenario 3 (calculated)" title="Объём упаковки вырос на 20%. Что происходит со стоимостью логистики?" />
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Объём до" value={`${fmtNum(litersBefore, 2)} л`} />
            <KpiTile label="Объём после" value={`${fmtNum(litersAfter, 2)} л`} />
            <KpiTile label="Логистика / ед. до" value={fmtRub(costBefore)} />
            <KpiTile label="Логистика / ед. после" value={fmtRub(costAfter)} status={costAfter > costBefore * 1.15 ? "critical" : "warning"} />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
            Рост {fmtPct((costAfter - costBefore) / costBefore)} в стоимости логистики за счёт всего 20% роста объёма
            — потому что упаковка перешла в другой тарифный диапазон (Модуль 05).
          </p>
        </Card>
      </section>

      <DecisionCaseBlock
        title="Scenario 4: один склад стал недоступен"
        fields={{
          situation: "Склад, обслуживающий 35% заказов региона, внезапно приостановил приёмку и отгрузку (форс-мажор).",
          data: "Альтернативные склады имеют свободную ёмкость, но выше логистический коэффициент для части регионов.",
          problem: "Заказы из зоны обслуживания склада не могут быть выполнены без немедленного перенаправления.",
          options: "(1) Перенаправить сток и заказы на соседние склады; (2) временно приостановить приём заказов из этой зоны; (3) экстренная cargo-поставка в альтернативный склад.",
          economics: "Перенаправление увеличивает logistics cost на пострадавшие заказы, но сохраняет выручку; приостановка заказов теряет выручку напрямую.",
          risk: "Если недоступность длительная — соседние склады тоже могут выйти на предел ёмкости (Модуль 16, алерт capacity > 85%).",
          decision: "Перенаправить немедленно, параллельно оценивая срок недоступности для решения о cargo-поставке.",
          expectedResult: "Временный рост logistics cost % от выручки — приемлем, если это временно и сохраняет продажи.",
        }}
      />

      <DecisionCaseBlock
        title="Scenario 5: спрос сместился из Москвы в Сибирь"
        fields={{
          situation: "Доля спроса Сибири выросла с 7% до 15% за квартал.",
          data: "Сток по-прежнему распределён по старым долям спроса.",
          problem: "Растёт mismatch score (Модуль 08/09) — доставка в Сибирь замедляется, растёт локальный stockout риск.",
          options: "(1) Постепенно перебалансировать сток; (2) резко перебросить крупную партию; (3) игнорировать как временный эффект.",
          economics: "Постепенная перебалансировка дешевле по логистике перемещения, но медленнее устраняет проблему.",
          risk: "Игнорирование риска оправдано только если подтверждено, что сдвиг спроса кратковременный.",
          decision: "Подтвердить устойчивость сдвига (3-4 недели данных), затем обновить demand_share склада и постепенно перебалансировать.",
          expectedResult: "Снижение mismatch score, рост скорости доставки в Сибирь, снижение локального stockout риска.",
        }}
      />

      <DecisionCaseBlock
        title="Scenario 6: FBS дороже FBW — стоит ли мигрировать инвентарь"
        fields={{
          situation: "Пересчёт (Модуль 04/14) показал, что для конкретного SKU итоговая логистическая стоимость на FBS выше, чем была бы на FBW.",
          data: "SKU: стабильные продажи, низкий return rate, компактная упаковка — по Decision Engine (Модуль 14) кандидат на FBW.",
          problem: "Продолжение работы на FBS теряет маржу относительно доступной альтернативы.",
          options: "(1) Полная миграция на FBW; (2) частичная миграция (топ-регион на FBW, остальное FBS); (3) остаться на FBS ради операционной гибкости.",
          economics: "Экономия на logistics cost per order при FBW должна перекрывать стоимость замороженного капитала в предварительном стоке.",
          risk: "Миграция требует точного прогноза, иначе экономия на логистике будет съедена стоимостью хранения излишков.",
          decision: "Частичная миграция — снижает риск ошибки прогноза при получении части экономического эффекта.",
          expectedResult: "Снижение cost per order для мигрированной доли, мониторинг 4-6 недель перед полной миграцией.",
        }}
      />

      <DecisionCaseBlock
        title="Scenario 7: продажи упали на 30% — нужно ли менять распределение стока"
        fields={{
          situation: "Общие продажи снизились на 30% за месяц, но неравномерно по регионам.",
          data: "Часть регионов просела сильнее среднего, часть держится на прежнем уровне.",
          problem: "Старое распределение стока по складам может больше не соответствовать новой структуре спроса.",
          options: "(1) Оставить распределение как есть, дождаться стабилизации; (2) пересчитать demand_share и перебалансировать; (3) резко сократить общий объём поставок без учёта региональной структуры.",
          economics: "При падении спроса главный риск — не stockout, а overstock и рост стоимости хранения (Модуль 07).",
          risk: "Резкое сокращение поставок без учёта региональной структуры может создать stockout там, где спрос держится.",
          decision: "Пересчитать demand_share по регионам на основе новых данных, скорректировать план поставок пропорционально, а не равномерно.",
          expectedResult: "Days of stock возвращается к целевому диапазону без создания локального дефицита в устойчивых регионах.",
        }}
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m17", score, total)} />
    </ModulePage>
  );
}
