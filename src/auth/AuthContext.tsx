/**
 * 認証状態(現在ユーザー)を保持する context。
 * token は localStorage(`jwtToken`)に保存し、マウント時に GET /user で
 * 復元する。e2e 契約の window.__conduit_debug__ もここで公開する。
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../api/client";
import type { User } from "../api/types";
import { clearToken, getToken, setToken } from "./token";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  state: AuthState;
  user: User | null;
  /** ログイン/登録成功時に呼ぶ。token を保存して認証状態にする。 */
  signIn: (user: User) => void;
  /** 設定更新などで最新の User を反映する。 */
  setUser: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState | "unavailable";
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  // token があれば復元を試みるので loading から始める
  const [state, setState] = useState<AuthState>(() => (getToken() ? "loading" : "unauthenticated"));
  const stateRef = useRef(state);
  const userRef = useRef(user);
  stateRef.current = state;
  userRef.current = user;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api
      .getCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setToken(u.token);
        userRef.current = u;
        setUserState(u);
        stateRef.current = "authenticated";
        setState("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        stateRef.current = "unauthenticated";
        setState("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken,
      getAuthState: () => stateRef.current,
      getCurrentUser: () => userRef.current,
    };
    return () => {
      window.__conduit_debug__ = undefined;
    };
  }, []);

  const signIn = useCallback((u: User) => {
    setToken(u.token);
    setUserState(u);
    setState("authenticated");
  }, []);

  const setUser = useCallback((u: User) => {
    setToken(u.token);
    setUserState(u);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUserState(null);
    setState("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, user, signIn, setUser, signOut }),
    [state, user, signIn, setUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
