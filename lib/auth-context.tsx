"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, setAccessToken, type SessionUser } from "./api";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (cpf: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** Usado após o cadastro (register), que já devolve token + usuário. */
  setSession: (accessToken: string, user: SessionUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Reidrata a sessão no carregamento: o cookie httpOnly de refresh gera um novo access.
  useEffect(() => {
    let active = true;
    authApi
      .refresh()
      .then((res) => {
        if (!active) return;
        setAccessToken(res.accessToken);
        setUser(res.user);
      })
      .catch(() => {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (cpf: string, password: string) => {
    const res = await authApi.login(cpf, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const setSession = (accessToken: string, u: SessionUser) => {
    setAccessToken(accessToken);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}

/** Rótulo amigável do papel para a UI. */
export function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ANALYST":
      return "Analista socioeconômica";
    case "VIEWER":
      return "Secretaria";
    default:
      return "Candidato(a)";
  }
}
