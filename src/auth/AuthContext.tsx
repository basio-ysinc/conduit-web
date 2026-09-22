/**
 * 認証状態(現在ユーザー)を保持する context。
 * token は localStorage(`jwtToken`)に保存し、マウント時に GET /user で
 * 復元する。e2e 契約の window.__conduit_debug__ もここで公開する。
 *
 * 起動時の GET /user 失敗の扱い:
 * - 4XX: 認証エラー。token を破棄して unauthenticated にする
 * - 5XX / ネットワークエラー / 不正なレスポンス: 一時障害。token を保持したまま
 *   unavailable にし、画面には "Connecting" インジケータを出す
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
import { ApiError, api } from "../api/client";
import type { User } from "../api/types";
import { clearToken, getToken, setToken } from "./token";

export type AuthState = "loading" | "authenticated" | "unauthenticated" | "unavailable";

export interface AuthContextValue {
  state: AuthState;
  user: User | null;
  /** ログイン/登録成功時に呼ぶ。token を保存して認証状態にする。 */
  signIn: (user: User) => void;
  /** 設定更新などで最新の User を反映する。 */
  setUser: (user: User) => void;
  signOut: () => void;
  /** unavailable 状態からの再接続。GET /user をやり直す。 */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
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

  const fetchCurrentUser = useCallback(() => {
    if (!getToken()) {
      setState("unauthenticated");
      return;
    }
    setState("loading");
    api
      .getCurrentUser()
      .then((u) => {
        setToken(u.token);
        setUserState(u);
        setState("authenticated");
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          clearToken();
          setUserState(null);
          setState("unauthenticated");
        } else {
          setState("unavailable");
        }
      });
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

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
    () => ({ state, user, signIn, setUser, signOut, retry: fetchCurrentUser }),
    [state, user, signIn, setUser, signOut, fetchCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
