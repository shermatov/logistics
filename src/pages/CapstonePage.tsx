import { useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { SectionHeading, Pill } from "../components/ui/Misc";
import { KpiTile } from "../components/ui/KpiTile";
import { skus, warehouses } from "../data/sampleData";
import { fmtNum, fmtPct } from "../lib/formulas";

interface Option {
  label: string;
  profitDelta: number;
  serviceDelta: number;
  capitalDelta: number;
  note: string;
}

interface DayEvent {
  day: number;
  title: string;
  description: string;
  options: Option[];
}

const events: DayEvent[] = [
  {
    day: 1,
    title: "Старт месяца",
    description: "Все склады в норме. SKU-004 (Товары для дома) показывает рост продаж третью неделю подряд — сток в России рассчитан на 9 дней.",
    options: [
      { label: "Заказать срочную cargo-партию из Кыргызстана уже сейчас", profitDelta: -2, serviceDelta: 3, capitalDelta: -3, note: "Опережающее решение снижает риск stockout, но замораживает капитал раньше срока." },
      { label: "Подождать ещё неделю данных, чтобы подтвердить тренд", profitDelta: 1, serviceDelta: -2, capitalDelta: 1, note: "Экономит капитал, но повышает риск не успеть к моменту, когда сток закончится." },
      { label: "Частично перебросить сток с менее загруженного склада", profitDelta: 0, serviceDelta: 1, capitalDelta: 0, note: "Быстрое и дешёвое решение, но временное — не устраняет корень проблемы (нужно больше стока в системе)." },
    ],
  },
  {
    day: 4,
    title: "Рост return rate у fashion-категории",
    description: "Return rate по 'Женская одежда' вырос с 30% до 38% за неделю. Основная причина в комментариях — 'размер не подошёл'.",
    options: [
      { label: "Обновить размерную сетку в карточках товара", profitDelta: 2, serviceDelta: 1, capitalDelta: 0, note: "Устраняет корневую причину, эффект проявится через 1-2 недели." },
      { label: "Временно снять SKU с рекламы, чтобы снизить объём заказов", profitDelta: -1, serviceDelta: 0, capitalDelta: 1, note: "Снижает абсолютные потери от возвратов, но и выручку." },
      { label: "Ничего не менять, дождаться месячной статистики", profitDelta: -2, serviceDelta: -1, capitalDelta: -1, note: "Продолжающийся высокий return rate копит убыток каждый день промедления." },
    ],
  },
  {
    day: 9,
    title: "Склад в Екатеринбурге приближается к пределу",
    description: "Загрузка склада RU-EKB достигла 88% ёмкости. Плановая поставка придёт через 6 дней.",
    options: [
      { label: "Приостановить отгрузку в этот склад, перенаправить в Новосибирск", profitDelta: 0, serviceDelta: -1, capitalDelta: 1, note: "Предотвращает отказ в приёмке, но временно ухудшает доступность товара для Урала." },
      { label: "Ускорить вывоз медленно оборачивающихся SKU с этого склада", profitDelta: 1, serviceDelta: 1, capitalDelta: 1, note: "Освобождает место без потери доступности ходовых товаров — требует больше операционных усилий." },
      { label: "Игнорировать — поставка скоро придёт сама, разберётся", profitDelta: -1, serviceDelta: -3, capitalDelta: -1, note: "Риск отказа в приёмке новых партий в течение 6 дней слишком высок, чтобы игнорировать." },
    ],
  },
  {
    day: 15,
    title: "Тариф на международную перевозку вырос на 15%",
    description: "Перевозчик поднял ставку на маршруте Бишкек → Москва. Следующая cargo-партия на 3200 единиц запланирована через 5 дней.",
    options: [
      { label: "Увеличить размер партии, чтобы снизить cost per unit", profitDelta: 2, serviceDelta: 0, capitalDelta: -2, note: "Классический trade-off: эффективность перевозки против замороженного капитала." },
      { label: "Найти альтернативного перевозчика в сжатые сроки", profitDelta: 1, serviceDelta: -1, capitalDelta: 0, note: "Может сэкономить, но риск задержки поставки из-за смены партнёра в последний момент." },
      { label: "Отправить партию как запланировано, принять рост тарифа", profitDelta: -1, serviceDelta: 1, capitalDelta: 0, note: "Безопасно для сроков, но полностью съедает потенциальную экономию." },
    ],
  },
  {
    day: 22,
    title: "Внезапный всплеск спроса на аксессуары",
    description: "SKU-012 (Аксессуары) продажи выросли в 2.5 раза за 3 дня — вирусный момент в соцсетях. Сток в России на 6 дней при обычном темпе, то есть на 2-3 дня при новом.",
    options: [
      { label: "Экстренно перебросить весь доступный сток из Кыргызстана", profitDelta: 3, serviceDelta: 2, capitalDelta: -2, note: "Ловит окно спроса, пока оно не закрылось — типичное поведение для вирального момента." },
      { label: "Ограничить количество единиц в заказе, чтобы растянуть остаток", profitDelta: -1, serviceDelta: -1, capitalDelta: 1, note: "Экономит сток, но теряет часть возможной выручки от всплеска." },
      { label: "Не реагировать, всплеск может быть кратковременным", profitDelta: -2, serviceDelta: -2, capitalDelta: 0, note: "Риск: если всплеск устойчивый, упущена значительная выручка." },
    ],
  },
];

export function CapstonePage() {
  const [dayIndex, setDayIndex] = useState(0);
  const [log, setLog] = useState<{ day: number; choice: string; note: string }[]>([]);
  const [metrics, setMetrics] = useState({ profit: 0, service: 0, capital: 0 });

  const current = events[dayIndex];
  const finished = dayIndex >= events.length;

  function choose(opt: Option) {
    setMetrics((m) => ({
      profit: m.profit + opt.profitDelta,
      service: m.service + opt.serviceDelta,
      capital: m.capital + opt.capitalDelta,
    }));
    setLog((l) => [...l, { day: current.day, choice: opt.label, note: opt.note }]);
    setDayIndex((i) => i + 1);
  }

  function restart() {
    setDayIndex(0);
    setLog([]);
    setMetrics({ profit: 0, service: 0, capital: 0 });
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--series-4), var(--series-2))", boxShadow: "var(--shadow-sm)", color: "white" }}
          >
            <Trophy size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-4)" }}>
              Capstone
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upsell — управление логистикой 30 дней
            </h1>
          </div>
        </div>
        <p className="relative text-sm mt-3 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Вымышленная компания Upsell: {skus.length} SKU, {warehouses.length} склада (Кыргызстан + Россия), FBS и
          FBW, разные категории и return rate. В течение месяца возникают события — принимайте решения, как
          руководитель логистики, и смотрите на совокупный эффект в конце.
        </p>
      </div>

      <section>
        <SectionHeading eyebrow="Company snapshot" title="Upsell — исходные данные" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="SKU в ассортименте" value={fmtNum(skus.length)} />
          <KpiTile label="Складов" value={fmtNum(warehouses.length)} />
          <KpiTile label="FBW доля SKU" value={fmtPct(skus.filter((s) => s.fulfillment_model === "FBW").length / skus.length)} />
          <KpiTile label="Средний return rate" value={fmtPct(skus.reduce((a, s) => a + s.return_rate, 0) / skus.length)} />
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Simulation" title={finished ? "Итоги месяца" : `День ${current.day} из 30`} />
        {!finished ? (
          <Card>
            <CardTitle>{current.title}</CardTitle>
            <p className="text-sm mb-4" style={{ color: "var(--text-primary)" }}>
              {current.description}
            </p>
            <div className="flex flex-col gap-2">
              {current.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => choose(opt)}
                  className="text-left text-sm rounded-xl border px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--series-4)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", boxShadow: "var(--shadow-xs)" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <KpiTile label="Profit score" value={String(metrics.profit)} status={metrics.profit > 3 ? "good" : metrics.profit >= 0 ? "warning" : "critical"} />
              <KpiTile label="Service level score" value={String(metrics.service)} status={metrics.service > 2 ? "good" : metrics.service >= 0 ? "warning" : "critical"} />
              <KpiTile label="Capital efficiency score" value={String(metrics.capital)} status={metrics.capital >= 0 ? "good" : "warning"} />
            </div>
            <Card>
              <CardTitle>Журнал решений</CardTitle>
              <div className="flex flex-col gap-3">
                {log.map((l, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                      День {l.day}: {l.choice}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {l.note}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <button
              onClick={restart}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 w-fit transition-transform duration-150 hover:-translate-y-0.5"
              style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
            >
              <RotateCcw size={14} strokeWidth={2.4} />
              Пройти заново
            </button>
          </>
        )}
      </section>

      <Card>
        <CardTitle>О симуляции <Pill tone="orange">v1</Pill></CardTitle>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Это первая версия capstone-симуляции: пять ключевых развилок месяца с прямым эффектом на profit, service
          level и capital efficiency. Полная версия по спецификации (события каждый из 30 дней, интеграция с
          реальными формулами reorder point / fully landed cost, сравнение с оптимальной стратегией day-by-day) —
          следующий шаг развития этого модуля.
        </p>
      </Card>
    </div>
  );
}
