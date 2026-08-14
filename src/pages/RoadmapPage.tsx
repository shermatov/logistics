import { Milestone, Database, ShieldAlert } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SectionHeading, Pill } from "../components/ui/Misc";
import { wbTariffs, cargoTariffs } from "../data/tariffs";

type Status = "done" | "progress" | "planned";

const statusMeta: Record<Status, { label: string; tone: "green" | "orange" | "blue" }> = {
  done: { label: "Готово", tone: "green" },
  progress: { label: "В процессе (v1)", tone: "orange" },
  planned: { label: "Запланировано", tone: "blue" },
};

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
}

const items: RoadmapItem[] = [
  {
    title: "21 модуль с калькуляторами и кейсами",
    description: "Основы → FBS/FBW → экономика → склад/запасы → cargo KG→RU → управление → стратегия.",
    status: "done",
  },
  {
    title: "Дашборд руководителя, Manager Mode, мобильная версия",
    description: "Интерактивные KPI и алерты, тренажёр решений, адаптивная вёрстка + деплой на Vercel с авто-деплоем из GitHub.",
    status: "done",
  },
  {
    title: "Capstone-симуляция на 30 дней",
    description: "Сейчас реализовано 5 ключевых развилок месяца вместо полноценных 30 дней с ежедневными событиями.",
    status: "progress",
  },
  {
    title: "Актуальные тарифы Wildberries",
    description: "Заменить учебные значения в data/tariffs.ts на текущие данные из официального seller-портала WB, с ручным обновлением по мере изменений.",
    status: "planned",
  },
  {
    title: "Подключение реальных данных компании",
    description: "Заменить sampleData.ts на реальные остатки, продажи и склады — через API/БД вместо сгенерированного примера.",
    status: "planned",
  },
  {
    title: "Аккаунты и синхронизация прогресса",
    description: "Сейчас прогресс живёт только в localStorage браузера. Нужен бэкенд, чтобы прогресс не терялся и был доступен с разных устройств.",
    status: "planned",
  },
  {
    title: "Экзамены по блокам курса",
    description: "Сейчас есть quiz в каждом модуле; сводный экзамен после каждого крупного блока (§26 исходного ТЗ) пока не реализован.",
    status: "planned",
  },
];

export function RoadmapPage() {
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
            style={{ background: "linear-gradient(135deg, var(--series-7), var(--series-1))", boxShadow: "var(--shadow-sm)", color: "white" }}
          >
            <Milestone size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-7)" }}>
              Данные и Roadmap
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Откуда данные и что дальше
            </h1>
          </div>
        </div>
        <p className="relative text-sm mt-3 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Прозрачно о том, что в проекте реально, что — учебный пример, и куда это движется дальше.
        </p>
      </div>

      <section>
        <SectionHeading eyebrow="Data sources" title="Откуда данные" />
        <div className="flex flex-col gap-3">
          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-2)" }} aria-hidden />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-2) 16%, transparent)", color: "var(--series-2)" }}>
                <ShieldAlert size={14} strokeWidth={2.4} />
              </span>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Тарифы (WB и cargo)</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Учебные значения, актуальные на <strong>{wbTariffs.as_of_date}</strong> (WB) и <strong>{cargoTariffs.as_of_date}</strong> (cargo) —
              не текущие реальные тарифы Wildberries или ставки перевозчиков. Явно помечены <code>is_assumption: true</code> в{" "}
              <code>src/data/tariffs.ts</code> и вынесены отдельно от формул, чтобы их можно было обновить, не трогая логику расчётов.
            </p>
          </Card>
          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-4)" }} aria-hidden />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-4) 16%, transparent)", color: "var(--series-4)" }}>
                <Database size={14} strokeWidth={2.4} />
              </span>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Компания «Upsell», SKU, склады, продажи</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Полностью вымышленный пример, сгенерированный детерминированным генератором прямо в коде (
              <code>src/data/sampleData.ts</code>). 24 SKU, 5 складов, 30-дневная история — не выгрузка из реальной
              системы и не связаны с какой-либо настоящей компанией.
            </p>
          </Card>
          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-1)" }} aria-hidden />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-1) 16%, transparent)", color: "var(--series-1)" }}>
                <Database size={14} strokeWidth={2.4} />
              </span>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Ваш прогресс</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Пройденные модули и результаты тестов хранятся только в <code>localStorage</code> этого браузера — нет
              аккаунта и нет сервера. Очистка данных браузера или переход на другое устройство обнулит прогресс.
            </p>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Roadmap" title="Что уже сделано и что дальше" />
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <Card key={item.title}>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </div>
                <Pill tone={statusMeta[item.status].tone}>{statusMeta[item.status].label}</Pill>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
