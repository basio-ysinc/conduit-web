// @vitest-environment happy-dom
import { type ReactNode, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api/client";
import type { Article, Profile as ProfileModel, User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { DEFAULT_AVATAR } from "../src/components/Navbar";
import { Profile as ProfilePage } from "../src/pages/Profile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { user: null as User | null },
  apiMock: {
    getProfile: vi.fn<(username: string) => Promise<ProfileModel>>(),
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

const me: ProfileModel = { username: "me", bio: "bio", image: null, following: false };
const bob: ProfileModel = { username: "bob", bio: "bob bio", image: null, following: false };
const alice: ProfileModel = {
  username: "alice",
  bio: "alice bio",
  image: "https://example.com/alice.png",
  following: false,
};

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

async function render(path: string, user: User | null = null, nav?: ReactNode) {
  auth.user = user;
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[path.startsWith("/") ? path : `/profile/${path}`]}>
        {nav}
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
  it("renders the profile image, username and bio", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice");

    expect(apiMock.getProfile).toHaveBeenCalledWith("alice");
    expect(container.querySelector("img.user-img")?.getAttribute("src")).toBe(
      "https://example.com/alice.png",
    );
    expect(container.querySelector(".user-info h4")?.textContent).toBe("alice");
    expect(container.querySelector(".user-info p")?.textContent).toBe("alice bio");
  });

  it("falls back to the default avatar when profile.image is null", async () => {
    apiMock.getProfile.mockResolvedValue({ ...alice, image: null });
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice");

    expect(container.querySelector("img.user-img")?.getAttribute("src")).toBe(DEFAULT_AVATAR);
  });

  it("shows 'Profile not found.' when the API returns 404", async () => {
    apiMock.getProfile.mockRejectedValue(new ApiError(404, {}));
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("ghost");

    expect(container.textContent).toContain("Profile not found.");
    expect(container.querySelector("ul.error-messages")).toBeNull();
    expect(container.querySelector("img.user-img")).toBeNull();
  });

  it("shows .error-messages when the API fails with a non-404 error", async () => {
    apiMock.getProfile.mockRejectedValue(new ApiError(500, { body: ["server error"] }));
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice");

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["body server error"]);
    expect(container.textContent).not.toContain("Profile not found.");
  });

  it("shows the Edit Profile Settings link on the current user's own profile", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice", { ...testUser, username: "alice" });

    const link = container.querySelector("a.action-btn");
    expect(link?.getAttribute("href")).toBe("/settings");
    expect(link?.textContent).toContain("Edit Profile Settings");
  });

  it("hides the Edit Profile Settings link on another user's profile", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice", testUser);

    expect(container.querySelector("a.action-btn")).toBeNull();
  });

  it("hides the Edit Profile Settings link when unauthenticated", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice");

    expect(container.querySelector("a.action-btn")).toBeNull();
  });

  it("refetches and ignores a stale response when the username param changes", async () => {
    let resolveAlice: (profile: ProfileModel) => void = () => {};
    apiMock.getProfile.mockImplementation(
      (username) =>
        new Promise<ProfileModel>((resolve) => {
          if (username === "alice") {
            resolveAlice = resolve;
          } else {
            resolve({ ...alice, username });
          }
        }),
    );
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    const container = await render("alice", null, <Link to="/profile/bob">to bob</Link>);

    const link = [...container.querySelectorAll("a")].find((a) => a.textContent === "to bob");
    if (!link) throw new Error("link not found");
    await click(link);

    expect(apiMock.getProfile).toHaveBeenCalledWith("bob");
    expect(container.querySelector(".user-info h4")?.textContent).toBe("bob");

    await act(async () => {
      resolveAlice(alice);
    });

    expect(container.querySelector(".user-info h4")?.textContent).toBe("bob");
  });

  it("shows own profile with Edit Profile Settings and no Follow button", async () => {
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });

    const container = await render("/profile/me", testUser);

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
    apiMock.getProfile.mockResolvedValue(bob);
    apiMock.getArticles.mockResolvedValue({ articles: [], articlesCount: 0 });
    apiMock.followUser.mockResolvedValue({ ...bob, following: true });

    const container = await render("/profile/bob", testUser);

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
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [bobsArticle], articlesCount: 1 });

    const container = await render("/profile/me/favorites", testUser);

    expect(apiMock.getArticles).toHaveBeenCalledWith({ favorited: "me", limit: 50 });
    const active = container.querySelector(".articles-toggle .nav-link.active");
    expect(active?.textContent).toContain("Favorited");
    expect(container.querySelectorAll(".article-preview")).toHaveLength(1);
  });

  it("removes the article from my own Favorited tab when I unfavorite it", async () => {
    apiMock.getProfile.mockResolvedValue(me);
    apiMock.getArticles.mockResolvedValue({ articles: [bobsArticle], articlesCount: 1 });
    apiMock.unfavoriteArticle.mockResolvedValue({ ...bobsArticle, favorited: false });

    const container = await render("/profile/me/favorites", testUser);
    const favButton = container.querySelector(".article-preview button");

    await click(favButton);

    expect(apiMock.unfavoriteArticle).toHaveBeenCalledWith("bobs-post");
    expect(container.querySelectorAll(".article-preview")).toHaveLength(0);
    expect(container.querySelector(".empty-feed-message")).not.toBeNull();
  });

  it("keeps the article on another user's Favorited tab when I unfavorite it", async () => {
    apiMock.getProfile.mockResolvedValue(bob);
    apiMock.getArticles.mockResolvedValue({ articles: [bobsArticle], articlesCount: 1 });
    apiMock.unfavoriteArticle.mockResolvedValue({
      ...bobsArticle,
      favorited: false,
      favoritesCount: 0,
    });

    const container = await render("/profile/bob/favorites", testUser);
    const favButton = container.querySelector(".article-preview button");

    await click(favButton);

    expect(apiMock.unfavoriteArticle).toHaveBeenCalledWith("bobs-post");
    // bob はまだお気に入りしているので一覧には残る
    expect(container.querySelectorAll(".article-preview")).toHaveLength(1);
  });
});
