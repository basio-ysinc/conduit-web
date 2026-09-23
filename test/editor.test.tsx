// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../src/api/types";
import { Editor } from "../src/pages/Editor";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    getArticle: vi.fn(),
    updateArticle: vi.fn(),
    createArticle: vi.fn(),
  },
}));

vi.mock("../src/api/client", async (importActual) => {
  const actual = await importActual<typeof import("../src/api/client")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      getArticle: apiMock.getArticle,
      updateArticle: apiMock.updateArticle,
      createArticle: apiMock.createArticle,
    },
  };
});

const existing: Article = {
  slug: "existing-post",
  title: "Existing title",
  description: "Existing description",
  body: "Existing body",
  tagList: ["tag1", "tag2"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  favorited: false,
  favoritesCount: 0,
  author: { username: "tester", bio: null, image: null, following: false },
};

let root: Root | null = null;

async function render(entry: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:slug" element={<Editor />} />
          <Route path="/article/:slug" element={<div>article page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

function input(container: HTMLElement, name: string): HTMLInputElement {
  const el = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!el) throw new Error(`input[name="${name}"] not found`);
  return el;
}

async function submit(container: HTMLElement) {
  const form = container.querySelector("form");
  await act(async () => {
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.clearAllMocks();
});

describe("Editor", () => {
  it("prefills the form from getArticle and saves via updateArticle", async () => {
    apiMock.getArticle.mockResolvedValue(existing);
    apiMock.updateArticle.mockResolvedValue({ ...existing, title: "Updated title" });
    const container = await render("/editor/existing-post");

    expect(apiMock.getArticle).toHaveBeenCalledWith("existing-post");
    expect(input(container, "title").value).toBe("Existing title");
    expect(input(container, "description").value).toBe("Existing description");
    expect(container.querySelector<HTMLTextAreaElement>('textarea[name="body"]')?.value).toBe(
      "Existing body",
    );
    expect(
      [...container.querySelectorAll(".tag-list .tag-pill")].map((el) => el.textContent),
    ).toEqual(["tag1", "tag2"]);

    // React の変更検知を通すためネイティブ setter で値を書き換える
    const titleInput = input(container, "title");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(titleInput, "Updated title");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await submit(container);

    expect(apiMock.updateArticle).toHaveBeenCalledWith("existing-post", {
      title: "Updated title",
      description: "Existing description",
      body: "Existing body",
      tagList: ["tag1", "tag2"],
    });
    expect(apiMock.createArticle).not.toHaveBeenCalled();
    expect(container.textContent).toBe("article page");
  });

  it("creates via createArticle when there is no slug", async () => {
    apiMock.createArticle.mockResolvedValue({ ...existing, slug: "new-post" });
    const container = await render("/editor");

    expect(apiMock.getArticle).not.toHaveBeenCalled();
    expect(input(container, "title").value).toBe("");

    await submit(container);

    expect(apiMock.createArticle).toHaveBeenCalledWith({
      title: "",
      description: "",
      body: "",
      tagList: [],
    });
    expect(apiMock.updateArticle).not.toHaveBeenCalled();
  });
});
