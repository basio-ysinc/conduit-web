// @vitest-environment happy-dom
import { type ReactNode, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api/client";
import type { Profile as ProfileModel, User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { DEFAULT_AVATAR } from "../src/components/Navbar";
import { Profile } from "../src/pages/Profile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { user: null as User | null },
  apiMock: { getProfile: vi.fn<(username: string) => Promise<ProfileModel>>() },
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
  return { ...actual, api: { ...actual.api, getProfile: apiMock.getProfile } };
});

const testUser: User = {
  email: "a@b.c",
  token: "token",
  username: "tester",
  bio: null,
  image: null,
};

const alice: ProfileModel = {
  username: "alice",
  bio: "alice bio",
  image: "https://example.com/alice.png",
  following: false,
};

let root: Root | null = null;

async function render(username: string, user: User | null = null, nav?: ReactNode) {
  auth.user = user;
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[`/profile/${username}`]}>
        {nav}
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.clearAllMocks();
});

describe("Profile", () => {
  it("renders the profile image, username and bio", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
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
    const container = await render("alice");

    expect(container.querySelector("img.user-img")?.getAttribute("src")).toBe(DEFAULT_AVATAR);
  });

  it("shows 'Profile not found.' when the API returns 404", async () => {
    apiMock.getProfile.mockRejectedValue(new ApiError(404, {}));
    const container = await render("ghost");

    expect(container.textContent).toContain("Profile not found.");
    expect(container.querySelector("ul.error-messages")).toBeNull();
    expect(container.querySelector("img.user-img")).toBeNull();
  });

  it("shows .error-messages when the API fails with a non-404 error", async () => {
    apiMock.getProfile.mockRejectedValue(new ApiError(500, { body: ["server error"] }));
    const container = await render("alice");

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["body server error"]);
    expect(container.textContent).not.toContain("Profile not found.");
  });

  it("shows the Edit Profile Settings link on the current user's own profile", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    const container = await render("alice", { ...testUser, username: "alice" });

    const link = container.querySelector("a.action-btn");
    expect(link?.getAttribute("href")).toBe("/settings");
    expect(link?.textContent).toContain("Edit Profile Settings");
  });

  it("hides the Edit Profile Settings link on another user's profile", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
    const container = await render("alice", testUser);

    expect(container.querySelector("a.action-btn")).toBeNull();
  });

  it("hides the Edit Profile Settings link when unauthenticated", async () => {
    apiMock.getProfile.mockResolvedValue(alice);
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
});
