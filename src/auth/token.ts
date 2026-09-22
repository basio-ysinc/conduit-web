/**
 * 認証トークンの永続化。e2e/SELECTORS.md の契約に合わせて
 * localStorage の `jwtToken` キーを使う。
 */
const KEY = "jwtToken";

function storage(): Storage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(KEY) ?? null;
}

export function setToken(token: string): void {
  storage()?.setItem(KEY, token);
}

export function clearToken(): void {
  storage()?.removeItem(KEY);
}
