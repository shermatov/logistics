import { useMemo, useState } from "react";
import { ModulePage } from "../components/lesson/ModulePage";
import { SectionHeading, NumberField, Pill } from "../components/ui/Misc";
import { Card, CardTitle } from "../components/ui/Card";
import { KpiTile } from "../components/ui/KpiTile";
import { LevelStack } from "../components/lesson/LevelStack";
import { QuizBlock } from "../components/lesson/QuizBlock";
import { ManagerQuestionBlock } from "../components/lesson/ReasoningBlocks";
import { useProgress } from "../state/progress";
import { regions, nationalDemandShares } from "../data/sampleData";
import { useDataStore } from "../state/dataStore";
import { allocationMismatchScore, fmtPct, fmtNum } from "../lib/formulas";

const quizQuestions = [
  {
    question: "Demand geography и inventory geography — это...",
    options: [
      "Одно и то же по определению",
      "Две разные карты: где живут покупатели и где физически лежит товар — они совпадают только если склад намеренно распределён под спрос",
      "Demand geography применяется только к FBW",
      "Inventory geography не важна для скорости доставки",
    ],
    correctIndex: 1,
    explanation: "Именно разрыв между этими двумя картами создаёт длинную last mile (Модуль 01) для регионов, где спрос есть, а инвентаря нет.",
  },
  {
    question: "Какой SKU, скорее всего, теряет больше всего от плохой локализации?",
    options: [
      "SKU с равномерным спросом по всем регионам",
      "SKU с сильно выраженным региональным спросом (например, зимняя одежда в Сибири), если весь его сток лежит в Москве",
      "SKU с очень низкой скоростью продаж в принципе",
      "Локализация не влияет на конкретные SKU, только на компанию в целом",
    ],
    correctIndex: 1,
    explanation: "Чем сильнее спрос сконцентрирован в конкретном регионе, тем дороже обходится несоответствие, если сток лежит в другом месте — упущенная выгода от несовпадения максимальна именно для таких SKU.",
  },
];

export function M09Localization() {
  const { recordQuiz } = useProgress();
  const { skus } = useDataStore();
  const [primaryStockSharePct, setPrimaryStockSharePct] = useState(90);

  const primaryRegion: (typeof regions)[number] = "Москва";
  const demandShares: Record<string, number> = { ...nationalDemandShares };
  const stockShares: Record<string, number> = useMemo(() => {
    const rest = (100 - primaryStockSharePct) / (regions.length - 1);
    const shares: Record<string, number> = {};
    regions.forEach((r) => {
      shares[r] = r === primaryRegion ? primaryStockSharePct / 100 : rest / 100;
    });
    return shares;
  }, [primaryStockSharePct]);

  const mismatch = allocationMismatchScore(demandShares, stockShares);

  const skewedSku = skus.reduce((max, s) => {
    const top = Math.max(...Object.values(s.demand_geography));
    const maxTop = Math.max(...Object.values(max.demand_geography));
    return top > maxTop ? s : max;
  }, skus[0]);

  return (
    <ModulePage
      moduleId="m09"
      number="09"
      title="Localization Logic — логика локализации"
      level="Manager"
      intro="У компании есть две карты одновременно: карта спроса (где живут покупатели) и карта инвентаря (где физически лежит товар). Локализация — это управление разрывом между ними."
    >
      <section>
        <SectionHeading eyebrow="Concept" title="Demand Geography vs Inventory Geography" />
        <Card padded={false}>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Регион</th>
                  <th className="text-left px-4 py-3" style={{ color: "var(--text-muted)" }}>Доля спроса</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, i) => (
                  <tr key={r} style={{ borderBottom: i < regions.length - 1 ? "1px solid var(--gridline)" : undefined }}>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{r}</td>
                    <td className="px-4 py-3 tabular" style={{ color: "var(--text-secondary)" }}>{fmtPct(nationalDemandShares[r])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="Scenario" title="Что происходит при разной концентрации стока" />
        <Card>
          <div className="max-w-sm mb-4">
            <NumberField label={`Доля стока в ${primaryRegion}, %`} value={primaryStockSharePct} onChange={setPrimaryStockSharePct} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
              label="Mismatch score"
              value={fmtPct(mismatch)}
              status={mismatch < 0.1 ? "good" : mismatch < 0.3 ? "warning" : "critical"}
            />
            <KpiTile label="Регионов недообеспечено" value={fmtNum(regions.filter((r) => stockShares[r] < demandShares[r] * 0.7).length)} />
            <KpiTile
              label="Сценарий"
              value={primaryStockSharePct >= 80 ? "A: Централизация" : primaryStockSharePct <= 45 ? "B: По спросу" : "Промежуточный"}
            />
            <KpiTile label="Ожидаемая скорость доставки" value={primaryStockSharePct >= 80 ? "Быстро в Москве, медленно в остальном" : "Равномерно средняя"} />
          </div>
          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            При 90% (Scenario A из спецификации) почти весь товар обслуживает лишь 40% реального спроса. При
            распределении близко к фактическим долям спроса (Scenario B) mismatch стремится к нулю, но требует
            точного прогноза по каждому региону — см. Модуль 08 для полного разбора экономики этого выбора.
          </p>
        </Card>
      </section>

      <LevelStack
        what={<>Локализация — это соответствие того, где лежит товар, тому, где на него есть спрос.</>}
        how={
          <>
            Каждый регион даёт свою долю заказов. Если доля стока в регионе ниже доли спроса — там будет либо
            медленная доставка (товар едет издалека), либо stockout.
          </>
        }
        why={
          <>
            Спрос формируется населением и поведением покупателей — он не подстраивается под то, где вам удобно
            хранить товар. Значит, стратегия хранения должна подстраиваться под спрос, а не наоборот.
          </>
        }
        decision={
          <>
            Руководитель логистики регулярно сверяет фактическое распределение спроса (не по интуиции, а по данным
            заказов) с фактическим распределением стока — и постепенно сдвигает второе к первому.
          </>
        }
      />

      <Card>
        <CardTitle>
          Пример: SKU с самым выраженным региональным спросом <Pill tone="blue">{skewedSku.sku_id}</Pill>
        </CardTitle>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          {skewedSku.product_name} — распределение спроса по регионам:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {regions.map((r) => (
            <div key={r} className="flex items-center justify-between text-sm rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{r}</span>
              <span className="tabular font-medium" style={{ color: "var(--text-primary)" }}>{fmtPct(skewedSku.demand_geography[r])}</span>
            </div>
          ))}
        </div>
      </Card>

      <ManagerQuestionBlock
        scenario={
          <>
            Вы обнаружили, что 90% стока по категории «Обувь» лежит на складе в Москве, хотя данные заказов
            показывают, что 35% спроса на эту категорию приходит из Урала и Сибири вместе взятых.
          </>
        }
        question="Опишите ваш план действий на ближайший месяц — что именно вы измените и в каком порядке?"
        seniorAnswer={
          <>
            Сначала — подтвердить, что это устойчивый паттерн спроса, а не разовый всплеск (минимум 3-4 недели
            данных). Затем — пересчитать оптимальное распределение стока пропорционально факту спроса (Модуль 08),
            и перебрасывать сток постепенно, начиная с самых ходовых SKU категории, а не всей категории разом —
            это снижает риск ошибки прогноза на весь объём сразу. Параллельно — обновить demand_share складов в
            Екатеринбурге и Новосибирске, чтобы будущие поставки автоматически шли туда в правильной пропорции.
          </>
        }
      />

      <QuizBlock questions={quizQuestions} onComplete={(score, total) => recordQuiz("m09", score, total)} />
    </ModulePage>
  );
}
