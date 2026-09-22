// @vitest-environment happy-dom
import { type ReactElement, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { ArticleList, Pagination } from "../src/components/ArticleList";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: "unauthenticated",
    user: null,
    signIn: () => {},
    setUser: () => {},
    signOut: () => {},
  }),
}));

const article: Article = {
  slug: "hello-world",
  title: "Hello World",
  description: "first post",
  body: "body",
  tagList: ["intro"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  favorited: false,
  favoritesCount: 0,
  author: { username: "tester", bio: null, image: null, following: false },
};

let root: Root | null = null;

async function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<MemoryRouter>{ui}</MemoryRouter>);
  });
  return container;
}

function pageHrefs(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll("a.page-link")].map((a) => a.getAttribute("href"));
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe("ArticleList", () => {
  it("shows the error in .error-messages, not as an .article-preview", async () => {
    const container = await render(
      <ArticleList
        articles={null}
        loading={false}
        error={{ server: ["failed"] }}
        emptyMessage="empty"
      />,
    );

    expect(container.querySelector("ul.error-messages li")?.textContent).toBe("server failed");
    expect(container.querySelector(".article-preview")).toBeNull();
  });

  it("shows the loading placeholder without .article-preview", async () => {
    const container = await render(
      <ArticleList articles={null} loading={true} error={null} emptyMessage="empty" />,
    );

    expect(container.textContent).toBe("Loading articles...");
    expect(container.querySelector(".article-preview")).toBeNull();
  });

  it("shows .empty-feed-message without .article-preview when the feed is empty", async () => {
    const container = await render(
      <ArticleList
        articles={[]}
        loading={false}
        error={null}
        emptyMessage="No articles are here... yet."
      />,
    );

    expect(container.querySelector(".empty-feed-message")?.textContent).toBe(
      "No articles are here... yet.",
    );
    expect(container.querySelector(".article-preview")).toBeNull();
  });

  it("renders one .article-preview card per article", async () => {
    const container = await render(
      <ArticleList
        articles={[article, { ...article, slug: "second-post", title: "Second" }]}
        loading={false}
        error={null}
        emptyMessage="empty"
      />,
    );

    const previews = container.querySelectorAll(".article-preview");
    expect(previews).toHaveLength(2);
    expect(previews[0].querySelector("h1")?.textContent).toBe("Hello World");
  });
});

describe("Pagination", () => {
  it("renders nothing when all articles fit on one page", async () => {
    const container = await render(<Pagination total={10} page={1} basePath="/" />);
    expect(container.querySelector(".pagination")).toBeNull();
  });

  it("renders ceil(total / 10) items and marks the current page active", async () => {
    const container = await render(<Pagination total={25} page={2} basePath="/" />);

    const items = [...container.querySelectorAll("li.page-item")];
    expect(items.map((li) => li.textContent)).toEqual(["1", "2", "3"]);
    expect(items.map((li) => li.className)).toEqual(["page-item", "page-item active", "page-item"]);
  });

  it("joins page= with ? when basePath has no query", async () => {
    const container = await render(<Pagination total={21} page={1} basePath="/tag/react" />);

    expect(pageHrefs(container)).toEqual([
      "/tag/react?page=1",
      "/tag/react?page=2",
      "/tag/react?page=3",
    ]);
  });

  it("joins page= with & when basePath already has a query", async () => {
    const container = await render(<Pagination total={21} page={1} basePath="/?feed=following" />);

    expect(pageHrefs(container)).toEqual([
      "/?feed=following&page=1",
      "/?feed=following&page=2",
      "/?feed=following&page=3",
    ]);
  });
});
