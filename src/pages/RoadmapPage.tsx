import { Link } from "react-router-dom";
import { Milestone, Database, ShieldAlert, Server, CheckCircle2, WifiOff } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SectionHeading, Pill } from "../components/ui/Misc";
import { useDataStore } from "../state/dataStore";

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
    title: "Backend + Postgres для SKU, складов и тарифов",
    description: "Express + Neon Postgres (server/), CRUD через /admin с admin-токеном. Фронтенд читает живые данные, с автоматическим откатом на встроенные при недоступности backend'а.",
    status: "done",
  },
  {
    title: "Capstone-симуляция на 30 дней",
    description: "Сейчас реализовано 5 ключевых развилок месяца вместо полноценных 30 дней с ежедневными событиями.",
    status: "progress",
  },
  {
    title: "Актуальные тарифы Wildberries",
    description: "Backend хранит тарифы в БД и их можно редактировать через /admin, но сами значения по-прежнему учебные. Нужно вручную заменить их текущими данными из официального seller-портала WB.",
    status: "planned",
  },
  {
    title: "Данные настоящей компании вместо примера Upsell",
    description: "Инфраструктура (БД + CRUD) готова, но в ней по-прежнему лежит вымышленный пример «Upsell». Чтобы это стало реальным инструментом, кто-то должен ввести настоящие SKU/склады через /admin или импортировать их.",
    status: "planned",
  },
  {
    title: "Аккаунты и синхронизация прогресса",
    description: "Прогресс обучения (пройденные модули, тесты) всё ещё живёт только в localStorage браузера — это отдельный контур от данных компании и пока не подключён к backend'у.",
    status: "planned",
  },
  {
    title: "Экзамены по блокам курса",
    description: "Сейчас есть quiz в каждом модуле; сводный экзамен после каждого крупного блока (§26 исходного ТЗ) пока не реализован.",
    status: "planned",
  },
];

function SourceBadge({ source }: { source: "live" | "fallback" | "loading" }) {
  if (source === "loading") return <Pill tone="neutral">Загрузка…</Pill>;
  if (source === "live")
    return (
      <Pill tone="green">
        <CheckCircle2 size={11} strokeWidth={2.4} /> backend
      </Pill>
    );
  return (
    <Pill tone="orange">
      <WifiOff size={11} strokeWidth={2.4} /> встроенный fallback
    </Pill>
  );
}

export function RoadmapPage() {
  const { wbTariffs, cargoTariffs, skus, warehouses, sources, backendConfigured } = useDataStore();

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
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-6)" }} aria-hidden />
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-6) 16%, transparent)", color: "var(--series-6)" }}>
                  <Server size={14} strokeWidth={2.4} />
                </span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Backend</h3>
              </div>
              <SourceBadge source={sources.skus} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {backendConfigured ? (
                <>
                  Express + Postgres (Neon), развёрнут отдельно (<code>server/</code>). Изменения через{" "}
                  <Link to="/admin" className="underline" style={{ color: "var(--series-6)" }}>/admin</Link> сразу видны во всех
                  модулях и калькуляторах, использующих живые данные. Если backend недоступен — приложение автоматически
                  переключается на встроенный набор данных, чтобы курс продолжал работать offline.
                </>
              ) : (
                "Backend не настроен в этой сборке (VITE_API_URL пуст) — приложение работает целиком на встроенных данных."
              )}
            </p>
          </Card>

          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-2)" }} aria-hidden />
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-2) 16%, transparent)", color: "var(--series-2)" }}>
                  <ShieldAlert size={14} strokeWidth={2.4} />
                </span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Тарифы (WB и cargo)</h3>
              </div>
              <SourceBadge source={sources.tariffs} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Учебные значения, актуальные на <strong>{wbTariffs.as_of_date}</strong> (WB) и <strong>{cargoTariffs.as_of_date}</strong> (cargo) —
              не текущие реальные тарифы Wildberries или ставки перевозчиков, даже когда они приходят из backend'а.
              Явно помечены <code>is_assumption: true</code> и редактируются через{" "}
              <Link to="/admin" className="underline" style={{ color: "var(--series-2)" }}>/admin</Link>, отдельно от формул.
            </p>
          </Card>

          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-4)" }} aria-hidden />
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-4) 16%, transparent)", color: "var(--series-4)" }}>
                  <Database size={14} strokeWidth={2.4} />
                </span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Компания «Upsell», SKU, склады</h3>
              </div>
              <SourceBadge source={sources.skus} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {skus.length} SKU, {warehouses.length} складов — по-прежнему вымышленный пример, изначально сгенерированный
              детерминированным генератором и теперь живущий в Postgres. Редактируемо через{" "}
              <Link to="/admin" className="underline" style={{ color: "var(--series-4)" }}>/admin</Link>, но не связано с
              какой-либо настоящей компанией.
            </p>
          </Card>

          <Card className="relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--series-1)" }} aria-hidden />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in srgb, var(--series-1) 16%, transparent)", color: "var(--series-1)" }}>
                <Database size={14} strokeWidth={2.4} />
              </span>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Ваш прогресс обучения</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Пройденные модули и результаты тестов — отдельный контур от данных компании выше, хранится только в{" "}
              <code>localStorage</code> этого браузера. Нет аккаунта и нет синхронизации между устройствами.
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
