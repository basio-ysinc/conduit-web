// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article, Profile, User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { Profile as ProfilePage } from "../src/pages/Profile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { user: null as User | null },
  apiMock: {
    getProfile: vi.fn(),
    getArticles: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
    favoriteArticle: vi.fn(),
    unfavoriteArticle: vi.fn(),
  },
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
  return { ...actual, api: { ...actual.api, ...apiMock } };
});

const testUser: User = {
  email: "a@b.c",
  token: "token",
  username: "me",
  bio: null,
  image: null,
};

const me: Profile = { username: "me", bio: "bio", image: null, following: false };
const bob: Profile = { username: "bob", bio: "bob bio", image: null, following: false };

const bobsArticle: Article = {
  slug: "bobs-post",
  title: "Bob's post",
  description: "desc",
  body: "body",
  tagList: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  favorited: true,
  favoritesCount: 1,
  author: bob,
};

let root: Root | null = null;

async function render(path: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/favorites" element={<ProfilePage />} />
          <Route path="/settings" element={<div>settings page</div>} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

async function click(element: Element | null) {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  auth.user = null;
  vi.clearAllMocks();
});

describe("Profile", () => {
  it("shows own profile with Edit Profile Settings and no Follow button", async () => {
    auth.user = testUser;
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });

    const container = await render("/profile/me");

    expect(apiMock.getProfile).toHaveBeenCalledWith("me");
    expect(apiMock.getArticles).toHaveBeenCalledWith({ author: "me", limit: 50 });
    expect(container.querySelector(".user-info h4")?.textContent).toBe("me");
    expect(container.querySelector('.user-info a[href="/settings"]')?.textContent).toContain(
      "Edit Profile Settings",
    );
    const buttons = [...container.querySelectorAll(".user-info button")].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons.some((t) => t?.includes("Follow"))).toBe(false);
  });

  it("shows a Follow button on another user's profile and toggles it", async () => {
    auth.user = testUser;
    apiMock.getProfile.mockResolvedValue(bob);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    apiMock.followUser.mockResolvedValue({ ...bob, following: true });

    const container = await render("/profile/bob");

    expect(container.querySelector(".user-info h4")?.textContent).toBe("bob");
    expect(container.querySelector('.user-info a[href="/settings"]')).toBeNull();
    const follow = [...container.querySelectorAll(".user-info button")].find((b) =>
      b.textContent?.includes("Follow bob"),
    );
    expect(follow).toBeDefined();

    await click(follow ?? null);

    expect(apiMock.followUser).toHaveBeenCalledWith("bob");
    const unfollow = [...container.querySelectorAll(".user-info button")].find((b) =>
      b.textContent?.includes("Unfollow bob"),
    );
    expect(unfollow).toBeDefined();
  });

  it("requests favorited articles on the Favorited tab", async () => {
    auth.user = testUser;
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [bobsArticle], articlesCount: 1 });

    const container = await render("/profile/me/favorites");

    expect(apiMock.getArticles).toHaveBeenCalledWith({ favorited: "me", limit: 50 });
    const active = container.querySelector(".articles-toggle .nav-link.active");
    expect(active?.textContent).toContain("Favorited");
    expect(container.querySelectorAll(".article-preview")).toHaveLength(1);
  });

  it("removes the article from my own Favorited tab when I unfavorite it", async () => {
    auth.user = testUser;
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [bobsArticle], articlesCount: 1 });
    apiMock.unfavoriteArticle.mockResolvedValue({ ...bobsArticle, favorited: false });

    const container = await render("/profile/me/favorites");
    const favButton = container.querySelector(".article-preview button");

    await click(favButton);

    expect(apiMock.unfavoriteArticle).toHaveBeenCalledWith("bobs-post");
    expect(container.querySelectorAll(".article-preview")).toHaveLength(0);
    expect(container.querySelector(".empty-feed-message")).not.toBeNull();
  });

  it("shows 'User not found' when the profile does not exist", async () => {
    auth.user = testUser;
    apiMock.getProfile.mockRejectedValue(new Error("404"));
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });

    const container = await render("/profile/ghost");

    expect(container.textContent).toContain("User not found");
  });
});
