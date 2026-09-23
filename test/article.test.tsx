// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Article as ArticleModel, Comment, User } from "../src/api/types";
import type { AuthContextValue, AuthState } from "../src/auth/AuthContext";
import { Article } from "../src/pages/Article";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { state: "authenticated" as AuthState, user: null as User | null },
  apiMock: {
    getArticle: vi.fn(),
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteArticle: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: auth.state,
    user: auth.user,
    signIn: () => {},
    setUser: () => {},
    signOut: () => {},
  }),
}));

vi.mock("../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../src/api/client")>("../src/api/client");
  return { ...actual, api: apiMock };
});

const article: ArticleModel = {
  slug: "hello-world",
  title: "Hello World",
  description: "desc",
  body: "article body",
  tagList: ["tag1"],
  createdAt: "2026-01-02T03:04:05.000Z",
  updatedAt: "2026-01-02T03:04:05.000Z",
  favorited: false,
  favoritesCount: 0,
  author: { username: "author", bio: null, image: null, following: false },
};

function makeUser(username: string): User {
  return { email: `${username}@example.com`, token: "t", username, bio: null, image: null };
}

function makeComment(id: number, username: string, body: string): Comment {
  return {
    id,
    createdAt: "2026-01-02T03:04:05.000Z",
    updatedAt: "2026-01-02T03:04:05.000Z",
    body,
    author: { username, bio: null, image: null, following: false },
  };
}

let root: Root | null = null;

async function render(user: User | null, comments: Comment[] = []) {
  auth.state = user ? "authenticated" : "unauthenticated";
  auth.user = user;
  apiMock.getArticle.mockResolvedValue(article);
  apiMock.getComments.mockResolvedValue(comments);
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[`/article/${article.slug}`]}>
        <Routes>
          <Route path="/article/:slug" element={<Article />} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

function deleteButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll("button")].filter((b) =>
    b.textContent?.includes("Delete Article"),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe("Article", () => {
  it("shows Edit Article / Delete Article to the author", async () => {
    const container = await render(makeUser("author"));

    expect(container.querySelectorAll('a[href="/editor/hello-world"]')).toHaveLength(2);
    expect(deleteButtons(container)).toHaveLength(2);
  });

  it("hides Edit Article / Delete Article from other users", async () => {
    const container = await render(makeUser("someone-else"));

    expect(container.querySelector('a[href^="/editor/"]')).toBeNull();
    expect(deleteButtons(container)).toHaveLength(0);
  });

  it("calls deleteArticle and navigates to / when the author deletes", async () => {
    apiMock.deleteArticle.mockResolvedValue(undefined);
    const container = await render(makeUser("author"));

    const button = deleteButtons(container)[0];
    await act(async () => {
      button.click();
    });

    expect(apiMock.deleteArticle).toHaveBeenCalledWith("hello-world");
    expect(container.textContent).toBe("home page");
  });

  it("shows .mod-options .ion-trash-a only on the user's own comments", async () => {
    const comments = [
      makeComment(1, "author", "my comment"),
      makeComment(2, "other", "their comment"),
    ];
    const container = await render(makeUser("author"), comments);

    const cards = [...container.querySelectorAll(".card:not(.comment-form)")];
    expect(cards).toHaveLength(2);
    const own = cards.find((c) => c.textContent?.includes("my comment"));
    const other = cards.find((c) => c.textContent?.includes("their comment"));
    expect(own?.querySelector(".mod-options i.ion-trash-a")).not.toBeNull();
    expect(other?.querySelector(".mod-options i.ion-trash-a")).toBeNull();
  });
});
