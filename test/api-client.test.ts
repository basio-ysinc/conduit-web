import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../src/api/client";
import { API_URL } from "../src/api/config";

function localStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock());
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("api client", () => {
  it("attaches Authorization: Token header when a token is stored", async () => {
    localStorage.setItem("jwtToken", "jwt-123");
    fetchMock.mockResolvedValue(jsonResponse({ tags: ["a"] }));

    await api.getTags();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_URL}/tags`);
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token jwt-123");
  });

  it("omits Authorization header when no token is stored", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tags: [] }));

    await api.getTags();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("wraps payloads and unwraps response envelopes", async () => {
    const user = { email: "a@b.c", token: "t", username: "u", bio: null, image: null };
    fetchMock.mockResolvedValue(jsonResponse({ user }, 201));

    const result = await api.register({ username: "u", email: "a@b.c", password: "pw" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_URL}/users`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      user: { username: "u", email: "a@b.c", password: "pw" },
    });
    expect(result).toEqual(user);
  });

  it("builds query strings for article filters", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [], articlesCount: 0 }));

    await api.getArticles({ tag: "x", author: "me", limit: 10, offset: 20 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${API_URL}/articles?tag=x&author=me&limit=10&offset=20`);
  });

  it("throws ApiError carrying field errors on 422", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { errors: { email: ["is invalid", "is taken"], title: ["can't be blank"] } },
        422,
      ),
    );

    const err = await api.login({ email: "x", password: "y" }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.status).toBe(422);
    expect(apiErr.errors).toEqual({
      email: ["is invalid", "is taken"],
      title: ["can't be blank"],
    });
  });

  it("throws ApiError with empty errors when the body has none", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));

    const err = await api.getTags().catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).errors).toEqual({});
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.deleteArticle("some-slug")).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_URL}/articles/some-slug`);
    expect(init.method).toBe("DELETE");
  });

  it("encodes path parameters", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ profile: { username: "a b" } }));

    await api.getProfile("a b");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${API_URL}/profiles/a%20b`);
  });
});
