import { useState } from "react";
import { User, LogIn, LogOut, Cloud, CloudOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Pill } from "../components/ui/Misc";
import { KpiTile } from "../components/ui/KpiTile";
import { useAuth } from "../state/auth";
import { useProgress } from "../state/progress";
import { moduleMeta } from "../data/moduleMeta";
import { fmtPct } from "../lib/formulas";

export function AccountPage() {
  const { token, email, backendConfigured, register, login, logout } = useAuth();

  if (!backendConfigured) {
    return (
      <div className="max-w-2xl">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} strokeWidth={2.4} style={{ color: "var(--status-warning)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Backend не настроен</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            VITE_API_URL не задан для этой сборки — аккаунты недоступны, прогресс хранится только в браузере.
          </p>
        </Card>
      </div>
    );
  }

  if (token && email) {
    return <AccountDashboard email={email} onLogout={logout} />;
  }

  return <AuthForm onRegister={register} onLogin={login} />;
}

function AccountDashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { completionPct, averageQuizPct, completedModules, syncStatus } = useProgress();
  const pct = completionPct(moduleMeta.length);
  const quizPct = averageQuizPct();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--series-1), var(--series-7))", color: "white", boxShadow: "var(--shadow-sm)" }}
            >
              <User size={20} strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-1)" }}>
                Аккаунт
              </div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {email}
              </h1>
            </div>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-xs font-medium underline shrink-0" style={{ color: "var(--text-muted)" }}>
            <LogOut size={13} strokeWidth={2.4} />
            Выйти
          </button>
        </div>
        <div className="relative mt-3">
          <SyncBadge status={syncStatus} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiTile label="Прогресс курса" value={fmtPct(pct)} status={pct > 0.6 ? "good" : pct > 0.2 ? "warning" : undefined} />
        <KpiTile label="Пройдено модулей" value={`${Object.keys(completedModules).length} / ${moduleMeta.length}`} />
        <KpiTile label="Средний результат тестов" value={quizPct > 0 ? fmtPct(quizPct) : "—"} />
        <KpiTile label="Синхронизация" value={syncStatus === "synced" ? "Включена" : syncStatus === "error" ? "Ошибка" : "Загрузка"} />
      </div>

      <Card>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Прогресс (пройденные модули, результаты тестов) теперь сохраняется на сервере и привязан к этому аккаунту —
          зайдите под этим email с любого устройства, и всё будет на месте. Ограничения: нет подтверждения email и
          восстановления пароля — это не полноценная production-авторизация, а лёгкая система для учебного проекта.
        </p>
      </Card>
    </div>
  );
}

function SyncBadge({ status }: { status: "local-only" | "loading" | "synced" | "error" }) {
  if (status === "synced")
    return (
      <Pill tone="green">
        <Cloud size={11} strokeWidth={2.4} /> Прогресс синхронизирован
      </Pill>
    );
  if (status === "error")
    return (
      <Pill tone="red">
        <CloudOff size={11} strokeWidth={2.4} /> Не удалось синхронизировать
      </Pill>
    );
  return (
    <Pill tone="neutral">
      <Cloud size={11} strokeWidth={2.4} /> Загрузка…
    </Pill>
  );
}

function AuthForm({ onRegister, onLogin }: { onRegister: (email: string, password: string) => Promise<void>; onLogin: (email: string, password: string) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") await onRegister(email, password);
      else await onLogin(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border px-6 py-7 mb-6"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--series-1), var(--series-7))", color: "white", boxShadow: "var(--shadow-sm)" }}
          >
            <User size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--series-1)" }}>
              Аккаунт
            </div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Синхронизация прогресса
            </h1>
          </div>
        </div>
        <p className="relative text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          Создайте аккаунт, чтобы пройденные модули и результаты тестов сохранялись на сервере и были доступны с
          любого устройства — без аккаунта прогресс остаётся только в этом браузере.
        </p>
      </div>

      <Card>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("login")}
            className="flex-1 text-sm font-semibold rounded-lg px-3 py-2"
            style={{
              background: mode === "login" ? "var(--surface-2)" : "transparent",
              color: mode === "login" ? "var(--text-primary)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Войти
          </button>
          <button
            onClick={() => setMode("register")}
            className="flex-1 text-sm font-semibold rounded-lg px-3 py-2"
            style={{
              background: mode === "register" ? "var(--surface-2)" : "transparent",
              color: mode === "register" ? "var(--text-primary)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Создать аккаунт
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Пароль {mode === "register" && "(мин. 6 символов)"}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ background: "color-mix(in srgb, var(--status-critical) 12%, transparent)", color: "var(--status-critical)" }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || !email || !password}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-[var(--radius-pill)] px-5 py-2.5 disabled:opacity-40 transition-transform duration-150 hover:-translate-y-0.5"
            style={{ background: "var(--gradient-brand)", color: "white", boxShadow: "var(--shadow-sm)" }}
          >
            {mode === "register" ? <CheckCircle2 size={14} strokeWidth={2.4} /> : <LogIn size={14} strokeWidth={2.4} />}
            {busy ? "Подождите…" : mode === "register" ? "Создать аккаунт" : "Войти"}
          </button>
        </div>
      </Card>
    </div>
  );
}
