import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** 認証必須ルートのガード。未ログインは /login へ。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state === "loading") return null;
  if (state !== "authenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
