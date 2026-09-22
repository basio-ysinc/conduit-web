/**
 * openapi.yml の全エンドポイントに対応する型付き API クライアント。
 * 認証が必要なリクエストには localStorage の token を
 * `Authorization: Token <jwt>` で付与する。
 */
import { getToken } from "../auth/token";
import { API_URL } from "./config";
import type {
  Article,
  ArticlesQuery,
  Comment,
  Errors,
  FeedQuery,
  LoginUser,
  NewArticle,
  NewComment,
  NewUser,
  Profile,
  UpdateArticle,
  UpdateUser,
  User,
} from "./types";

/** API が返すエラー。`errors` は GenericErrorModel のフィールド名 -> メッセージ配列。 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Errors;

  constructor(status: number, errors: Errors) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isErrors(value: unknown): value is { errors: Errors } {
  return typeof value === "object" && value !== null && "errors" in value;
}

async function parseErrors(res: Response): Promise<Errors> {
  try {
    const body: unknown = await res.json();
    if (isErrors(body)) return body.errors;
  } catch {
    // ボディが JSON でない / errors を持たない場合は空を返す
  }
  return {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrors(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(
    params as Record<string, string | number | undefined>,
  )) {
    if (value !== undefined) search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // User and Authentication
  login: (user: LoginUser) =>
    request<{ user: User }>("POST", "/users/login", { user }).then((r) => r.user),
  register: (user: NewUser) =>
    request<{ user: User }>("POST", "/users", { user }).then((r) => r.user),
  getCurrentUser: () => request<{ user: User }>("GET", "/user").then((r) => r.user),
  updateCurrentUser: (user: UpdateUser) =>
    request<{ user: User }>("PUT", "/user", { user }).then((r) => r.user),

  // Profile
  getProfile: (username: string) =>
    request<{ profile: Profile }>("GET", `/profiles/${encodeURIComponent(username)}`).then(
      (r) => r.profile,
    ),
  followUser: (username: string) =>
    request<{ profile: Profile }>("POST", `/profiles/${encodeURIComponent(username)}/follow`).then(
      (r) => r.profile,
    ),
  unfollowUser: (username: string) =>
    request<{ profile: Profile }>(
      "DELETE",
      `/profiles/${encodeURIComponent(username)}/follow`,
    ).then((r) => r.profile),

  // Articles
  getArticles: (params: ArticlesQuery = {}) =>
    request<{ articles: Article[]; articlesCount: number }>("GET", `/articles${query(params)}`),
  getArticlesFeed: (params: FeedQuery = {}) =>
    request<{ articles: Article[]; articlesCount: number }>(
      "GET",
      `/articles/feed${query(params)}`,
    ),
  createArticle: (article: NewArticle) =>
    request<{ article: Article }>("POST", "/articles", { article }).then((r) => r.article),
  getArticle: (slug: string) =>
    request<{ article: Article }>("GET", `/articles/${encodeURIComponent(slug)}`).then(
      (r) => r.article,
    ),
  updateArticle: (slug: string, article: UpdateArticle) =>
    request<{ article: Article }>("PUT", `/articles/${encodeURIComponent(slug)}`, {
      article,
    }).then((r) => r.article),
  deleteArticle: (slug: string) => request<void>("DELETE", `/articles/${encodeURIComponent(slug)}`),

  // Comments
  getComments: (slug: string) =>
    request<{ comments: Comment[] }>("GET", `/articles/${encodeURIComponent(slug)}/comments`).then(
      (r) => r.comments,
    ),
  createComment: (slug: string, comment: NewComment) =>
    request<{ comment: Comment }>("POST", `/articles/${encodeURIComponent(slug)}/comments`, {
      comment,
    }).then((r) => r.comment),
  deleteComment: (slug: string, id: number) =>
    request<void>(
      "DELETE",
      `/articles/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}`,
    ),

  // Favorites
  favoriteArticle: (slug: string) =>
    request<{ article: Article }>("POST", `/articles/${encodeURIComponent(slug)}/favorite`).then(
      (r) => r.article,
    ),
  unfavoriteArticle: (slug: string) =>
    request<{ article: Article }>("DELETE", `/articles/${encodeURIComponent(slug)}/favorite`).then(
      (r) => r.article,
    ),

  // Tags
  getTags: () => request<{ tags: string[] }>("GET", "/tags").then((r) => r.tags),
};
