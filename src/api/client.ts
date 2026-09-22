import type { Article, ArticlesResponse, Profile, User } from "./types";

// API は同一オリジンの /api 経由で呼ぶ。vite dev/preview が VITE_API_URL(vite.config.ts)へ
// プロキシするため、ブラウザからのクロスオリジン fetch(conduit-api は CORS を返さない)を避けられる。
const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors: Record<string, string[]>,
  ) {
    super(`API error ${status}`);
  }
}

/** { field: [msg, ...] } 形式のエラーを表示用文字列に平坦化する。 */
export function errorMessages(err: unknown): string[] {
  if (err instanceof ApiError) {
    return Object.entries(err.errors).flatMap(([field, msgs]) =>
      msgs.map((m) => (field === "body" ? m : `${field} ${m}`)),
    );
  }
  return ["request failed"];
}

async function request<T>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, string[]> };
    throw new ApiError(res.status, data.errors ?? { body: [`request failed (${res.status})`] });
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- users / user ---

export function registerUser(input: { username: string; email: string; password: string }) {
  return request<{ user: User }>("/users", { method: "POST", body: { user: input } });
}

export function loginUser(input: { email: string; password: string }) {
  return request<{ user: User }>("/users/login", { method: "POST", body: { user: input } });
}

export function getCurrentUser(token: string) {
  return request<{ user: User }>("/user", { token });
}

export function updateUser(
  token: string,
  input: { username?: string; email?: string; password?: string; bio?: string; image?: string },
) {
  return request<{ user: User }>("/user", { method: "PUT", body: { user: input }, token });
}

// --- profiles ---

export function getProfile(username: string, token?: string) {
  return request<{ profile: Profile }>(`/profiles/${encodeURIComponent(username)}`, { token });
}

export function followUser(username: string, token: string) {
  return request<{ profile: Profile }>(`/profiles/${encodeURIComponent(username)}/follow`, {
    method: "POST",
    token,
  });
}

export function unfollowUser(username: string, token: string) {
  return request<{ profile: Profile }>(`/profiles/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
    token,
  });
}

// --- articles ---

export function listArticles(
  params: { tag?: string; author?: string; favorited?: string; limit?: number; offset?: number },
  token?: string,
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const qs = q.toString();
  return request<ArticlesResponse>(`/articles${qs ? `?${qs}` : ""}`, { token });
}

export function getFeed(token: string, params: { limit?: number; offset?: number } = {}) {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const qs = q.toString();
  return request<ArticlesResponse>(`/articles/feed${qs ? `?${qs}` : ""}`, { token });
}

export function getArticle(slug: string, token?: string) {
  return request<{ article: Article }>(`/articles/${encodeURIComponent(slug)}`, { token });
}

export function createArticle(
  token: string,
  input: { title: string; description: string; body: string; tagList?: string[] },
) {
  return request<{ article: Article }>("/articles", {
    method: "POST",
    body: { article: input },
    token,
  });
}

export function updateArticle(
  token: string,
  slug: string,
  input: { title?: string; description?: string; body?: string; tagList?: string[] },
) {
  return request<{ article: Article }>(`/articles/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: { article: input },
    token,
  });
}

export function deleteArticle(token: string, slug: string) {
  return request<void>(`/articles/${encodeURIComponent(slug)}`, { method: "DELETE", token });
}

export function favoriteArticle(token: string, slug: string) {
  return request<{ article: Article }>(`/articles/${encodeURIComponent(slug)}/favorite`, {
    method: "POST",
    token,
  });
}

export function unfavoriteArticle(token: string, slug: string) {
  return request<{ article: Article }>(`/articles/${encodeURIComponent(slug)}/favorite`, {
    method: "DELETE",
    token,
  });
}

export function getTags() {
  return request<{ tags: string[] }>("/tags");
}
