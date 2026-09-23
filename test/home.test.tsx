// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContextValue, AuthState } from "../src/auth/AuthContext";
import { Home } from "../src/pages/Home";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { state: "unauthenticated" as AuthState },
  apiMock: {
    getArticles: vi.fn(),
    getArticlesFeed: vi.fn(),
    getTags: vi.fn(),
  },
}));

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: auth.state,
    user: null,
    signIn: () => {},
    setUser: () => {},
    signOut: () => {},
  }),
}));

vi.mock("../src/api/client", async (importActual) => {
  const actual = await importActual<typeof import("../src/api/client")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      getArticles: apiMock.getArticles,
      getArticlesFeed: apiMock.getArticlesFeed,
      getTags: apiMock.getTags,
    },
  };
});

let root: Root | null = null;

async function render(entry: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

beforeEach(() => {
  apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
  apiMock.getArticlesFeed.mockResolvedValue({ articles: [], articlesCount: 0 });
  apiMock.getTags.mockResolvedValue([]);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.clearAllMocks();
});

describe("Home", () => {
  it("fetches the global feed for / even when unauthenticated", async () => {
    auth.state = "unauthenticated";
    await render("/");

    expect(apiMock.getArticles).toHaveBeenCalledWith({
      tag: undefined,
      limit: 10,
      offset: 0,
    });
    expect(apiMock.getArticlesFeed).not.toHaveBeenCalled();
  });

  it("does not redirect or fetch while auth state is still loading", async () => {
    auth.state = "loading";
    const container = await render("/?feed=following");

    expect(container.querySelector(".home-page")).not.toBeNull();
    expect(apiMock.getArticlesFeed).not.toHaveBeenCalled();
    expect(apiMock.getArticles).not.toHaveBeenCalled();
  });

  it("redirects /?feed=following to /login when unauthenticated", async () => {
    auth.state = "unauthenticated";
    const container = await render("/?feed=following");

    expect(container.textContent).toBe("login page");
    expect(apiMock.getArticlesFeed).not.toHaveBeenCalled();
  });

  it("fetches the following feed when authenticated", async () => {
    auth.state = "authenticated";
    await render("/?feed=following&page=2");

    expect(apiMock.getArticlesFeed).toHaveBeenCalledWith({ limit: 10, offset: 10 });
    expect(apiMock.getArticles).not.toHaveBeenCalled();
  });
});
