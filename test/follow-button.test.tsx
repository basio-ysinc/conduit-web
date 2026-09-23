// @vitest-environment happy-dom
import { act, useState } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Profile, User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { FollowButton } from "../src/components/FollowButton";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { user: null as User | null },
  apiMock: { followUser: vi.fn(), unfollowUser: vi.fn() },
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
      followUser: apiMock.followUser,
      unfollowUser: apiMock.unfollowUser,
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

const bob: Profile = { username: "bob", bio: null, image: null, following: false };

function Harness({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  return <FollowButton profile={profile} onChange={setProfile} />;
}

let root: Root | null = null;

async function render(initial: Profile) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={[`/profile/${initial.username}`]}>
        <Routes>
          <Route path="/profile/:username" element={<Harness initial={initial} />} />
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

describe("FollowButton", () => {
  it("shows 'Follow <name>' with btn-outline-secondary when not following", async () => {
    auth.user = testUser;
    const container = await render(bob);

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Follow bob");
    expect(button?.classList.contains("btn-outline-secondary")).toBe(true);
  });

  it("calls followUser and switches to 'Unfollow' + btn-secondary on click", async () => {
    auth.user = testUser;
    apiMock.followUser.mockResolvedValue({ ...bob, following: true });
    const container = await render(bob);

    await click(container);

    expect(apiMock.followUser).toHaveBeenCalledWith("bob");
    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Unfollow bob");
    expect(button?.classList.contains("btn-secondary")).toBe(true);
  });

  it("calls unfollowUser and switches back to 'Follow' when already following", async () => {
    auth.user = testUser;
    const followingBob = { ...bob, following: true };
    apiMock.unfollowUser.mockResolvedValue(bob);
    const container = await render(followingBob);

    await click(container);

    expect(apiMock.unfollowUser).toHaveBeenCalledWith("bob");
    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Follow bob");
    expect(button?.classList.contains("btn-outline-secondary")).toBe(true);
  });

  it("navigates to /login without calling the API when unauthenticated", async () => {
    auth.user = null;
    const container = await render(bob);

    await click(container);

    expect(container.textContent).toBe("login page");
    expect(apiMock.followUser).not.toHaveBeenCalled();
    expect(apiMock.unfollowUser).not.toHaveBeenCalled();
  });
});
