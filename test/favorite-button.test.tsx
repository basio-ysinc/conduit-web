// @vitest-environment happy-dom
import { act, useState } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article, User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { FavoriteButtonLarge, FavoriteButtonSmall } from "../src/components/FavoriteButton";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { user: null as User | null },
  apiMock: { favoriteArticle: vi.fn(), unfavoriteArticle: vi.fn() },
}));

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: auth.user ? "authenticated" : "unauthenticated",
    user: auth.user,
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
      favoriteArticle: apiMock.favoriteArticle,
      unfavoriteArticle: apiMock.unfavoriteArticle,
    },
  };
});

const testUser: User = {
  email: "a@b.c",
  token: "token",
  username: "me",
  bio: null,
  image: null,
};

const article: Article = {
  slug: "hello-world",
  title: "Hello World",
  description: "desc",
  body: "body",
  tagList: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  favorited: false,
  favoritesCount: 3,
  author: { username: "bob", bio: null, image: null, following: false },
};

function Harness({
  initial,
  large,
}: {
  initial: Article;
  large?: boolean;
}) {
  const [current, setCurrent] = useState(initial);
  return large ? (
    <FavoriteButtonLarge article={current} onChange={setCurrent} />
  ) : (
    <FavoriteButtonSmall article={current} onChange={setCurrent} />
  );
}

let root: Root | null = null;

async function render(initial: Article, large = false) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Harness initial={initial} large={large} />} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

async function click(container: HTMLElement) {
  const button = container.querySelector("button");
  await act(async () => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  return button;
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  auth.user = null;
  vi.clearAllMocks();
});

describe("FavoriteButtonSmall", () => {
  it("shows the count with btn-outline-primary when not favorited", async () => {
    auth.user = testUser;
    const container = await render(article);

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("3");
    expect(button?.classList.contains("btn-outline-primary")).toBe(true);
  });

  it("calls favoriteArticle and switches to btn-primary with the updated count", async () => {
    auth.user = testUser;
    apiMock.favoriteArticle.mockResolvedValue({
      ...article,
      favorited: true,
      favoritesCount: 4,
    });
    const container = await render(article);

    await click(container);

    expect(apiMock.favoriteArticle).toHaveBeenCalledWith("hello-world");
    const button = container.querySelector("button");
    expect(button?.classList.contains("btn-primary")).toBe(true);
    expect(button?.textContent).toContain("4");
  });

  it("calls unfavoriteArticle and switches back to btn-outline-primary", async () => {
    auth.user = testUser;
    apiMock.unfavoriteArticle.mockResolvedValue({
      ...article,
      favorited: false,
      favoritesCount: 2,
    });
    const container = await render({ ...article, favorited: true, favoritesCount: 3 });

    await click(container);

    expect(apiMock.unfavoriteArticle).toHaveBeenCalledWith("hello-world");
    const button = container.querySelector("button");
    expect(button?.classList.contains("btn-outline-primary")).toBe(true);
    expect(button?.textContent).toContain("2");
  });

  it("navigates to /login without calling the API when unauthenticated", async () => {
    auth.user = null;
    const container = await render(article);

    await click(container);

    expect(container.textContent).toBe("login page");
    expect(apiMock.favoriteArticle).not.toHaveBeenCalled();
  });
});

describe("FavoriteButtonLarge", () => {
  it("shows 'Favorite Article (n)' when not favorited", async () => {
    auth.user = testUser;
    const container = await render(article, true);

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Favorite Article");
    expect(button?.textContent).toContain("(3)");
    expect(button?.classList.contains("btn-outline-primary")).toBe(true);
  });

  it("switches to 'Unfavorite Article' and updates the counter on click", async () => {
    auth.user = testUser;
    apiMock.favoriteArticle.mockResolvedValue({
      ...article,
      favorited: true,
      favoritesCount: 4,
    });
    const container = await render(article, true);

    await click(container);

    expect(apiMock.favoriteArticle).toHaveBeenCalledWith("hello-world");
    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Unfavorite Article");
    expect(button?.textContent).toContain("(4)");
    expect(button?.classList.contains("btn-primary")).toBe(true);
  });

  it("navigates to /login without calling the API when unauthenticated", async () => {
    auth.user = null;
    const container = await render(article, true);

    await click(container);

    expect(container.textContent).toBe("login page");
    expect(apiMock.favoriteArticle).not.toHaveBeenCalled();
  });
});
