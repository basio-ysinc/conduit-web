import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "../api/client";
import type { User } from "../api/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const TOKEN_KEY = "jwtToken";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => "authenticated" | "unauthenticated" | "unavailable" | "loading";
      getCurrentUser: () => User | null;
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    let cancelled = false;
    api
      .getCurrentUser(token)
      .then((res) => {
        if (cancelled) return;
        setUserState(res.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = useCallback((u: User) => {
    localStorage.setItem(TOKEN_KEY, u.token);
    setUserState(u);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setUser((await api.loginUser({ email, password })).user);
    },
    [setUser],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setUser((await api.registerUser({ username, email, password })).user);
    },
    [setUser],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUserState(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token: user?.token ?? null, login, register, logout, setUser }),
    [status, user, login, register, logout, setUser],
  );

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => localStorage.getItem(TOKEN_KEY),
      getAuthState: () => status,
      getCurrentUser: () => user,
    };
  }, [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
