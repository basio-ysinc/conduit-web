// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api/client";
import type { Article, User } from "../src/api/types";
import type { AuthContextValue, AuthState } from "../src/auth/AuthContext";
import { Editor } from "../src/pages/Editor";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { state: "authenticated" as AuthState, user: null as User | null },
  apiMock: {
    getArticle: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
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

const author: User = {
  email: "author@example.com",
  token: "t",
  username: "author",
  bio: null,
  image: null,
};

const existing: Article = {
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

let root: Root | null = null;

async function render(initialEntry: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:slug" element={<Editor />} />
          <Route path="/article/:slug" element={<div>ARTICLE PAGE</div>} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

function setInput(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function submit(container: HTMLElement) {
  const form = container.querySelector("form");
  await act(async () => {
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function pressEnterOnTagInput(container: HTMLElement, tag: string) {
  const input = container.querySelector<HTMLInputElement>('input[placeholder="Enter tags"]');
  if (!input) throw new Error("tag input not found");
  await act(async () => {
    setInput(input, tag);
  });
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  auth.state = "authenticated";
  auth.user = author;
  vi.clearAllMocks();
});

describe("Editor (new)", () => {
  it("renders the form per the selectors contract", async () => {
    const container = await render("/editor");

    expect(container.querySelector('input[name="title"]')).not.toBeNull();
    expect(container.querySelector('input[name="description"]')).not.toBeNull();
    expect(container.querySelector('textarea[name="body"]')).not.toBeNull();
    expect(container.querySelector('input[placeholder="Enter tags"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe("Publish Article");
  });

  it("adds a .tag-pill on Enter and removes it via the icon", async () => {
    const container = await render("/editor");

    await pressEnterOnTagInput(container, "react");
    await pressEnterOnTagInput(container, "vite");

    const pills = container.querySelectorAll(".tag-list .tag-pill");
    expect(pills.length).toBe(2);
    expect(container.textContent).toContain("react");
    expect(container.textContent).toContain("vite");

    const icon = pills[0].querySelector("i");
    await act(async () => {
      icon?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelectorAll(".tag-list .tag-pill").length).toBe(1);
    expect(container.textContent).not.toContain("react");
  });

  it("creates an article and navigates to its page", async () => {
    apiMock.createArticle.mockResolvedValue({ ...existing, slug: "new-slug" });
    const container = await render("/editor");

    await act(async () => {
      setInput(
        container.querySelector<HTMLInputElement>('input[name="title"]') as HTMLInputElement,
        "My Title",
      );
      setInput(
        container.querySelector<HTMLInputElement>('input[name="description"]') as HTMLInputElement,
        "My Desc",
      );
      setInput(
        container.querySelector<HTMLTextAreaElement>(
          'textarea[name="body"]',
        ) as HTMLTextAreaElement,
        "My Body",
      );
    });
    await pressEnterOnTagInput(container, "tag1");

    await submit(container);

    expect(apiMock.createArticle).toHaveBeenCalledWith({
      title: "My Title",
      description: "My Desc",
      body: "My Body",
      tagList: ["tag1"],
    });
    expect(container.textContent).toBe("ARTICLE PAGE");
  });

  it("shows each field error in .error-messages on 422", async () => {
    apiMock.createArticle.mockRejectedValue(
      new ApiError(422, { title: ["can't be blank"], body: ["can't be blank"] }),
    );
    const container = await render("/editor");

    await submit(container);

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["title can't be blank", "body can't be blank"]);
    expect(container.textContent).not.toBe("ARTICLE PAGE");
  });
});

describe("Editor (edit)", () => {
  it("loads the article into the form and updates it", async () => {
    apiMock.getArticle.mockResolvedValue(existing);
    apiMock.updateArticle.mockResolvedValue(existing);
    const container = await render(`/editor/${existing.slug}`);

    expect(apiMock.getArticle).toHaveBeenCalledWith(existing.slug);
    expect(container.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe(
      "Hello World",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="description"]')?.value).toBe(
      "desc",
    );
    expect(container.querySelector<HTMLTextAreaElement>('textarea[name="body"]')?.value).toBe(
      "article body",
    );
    expect(container.querySelectorAll(".tag-list .tag-pill").length).toBe(1);

    await act(async () => {
      setInput(
        container.querySelector<HTMLInputElement>('input[name="title"]') as HTMLInputElement,
        "Updated",
      );
    });
    await submit(container);

    expect(apiMock.updateArticle).toHaveBeenCalledWith(existing.slug, {
      title: "Updated",
      description: "desc",
      body: "article body",
      tagList: ["tag1"],
    });
  });

  it("redirects non-authors to home", async () => {
    apiMock.getArticle.mockResolvedValue(existing);
    auth.user = { ...author, username: "intruder" };
    const container = await render(`/editor/${existing.slug}`);

    expect(apiMock.updateArticle).not.toHaveBeenCalled();
    expect(container.textContent).toBe("HOME");
  });
});
