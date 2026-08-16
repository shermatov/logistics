import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { registerAccount, loginAccount, API_URL } from "../lib/api";

const TOKEN_KEY = "logistics-user-token";
const EMAIL_KEY = "logistics-user-email";

interface AuthState {
  token: string | null;
  email: string | null;
  backendConfigured: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));

  const persist = useCallback((t: string, e: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(EMAIL_KEY, e);
    setToken(t);
    setEmail(e);
  }, []);

  const register = useCallback(
    async (e: string, password: string) => {
      const res = await registerAccount(e, password);
      persist(res.token, res.email);
    },
    [persist]
  );

  const login = useCallback(
    async (e: string, password: string) => {
      const res = await loginAccount(e, password);
      persist(res.token, res.email);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, email, backendConfigured: Boolean(API_URL), register, login, logout }),
    [token, email, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
