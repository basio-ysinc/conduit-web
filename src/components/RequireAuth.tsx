import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * 認証必須ルートのガード。未ログインは /login へ。
 * サーバ障害中(unavailable)はトークンを保持したままなので、ログアウト扱いに
 * せずホーム(再接続 UI がある)へ退避する。
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state === "loading") return null;
  if (state === "unavailable") return <Navigate to="/" replace />;
  if (state !== "authenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
