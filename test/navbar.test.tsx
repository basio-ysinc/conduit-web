// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "../src/api/types";
import type { AuthContextValue, AuthState } from "../src/auth/AuthContext";
import { DEFAULT_AVATAR, Navbar } from "../src/components/Navbar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth } = vi.hoisted(() => ({
  auth: { state: "unauthenticated" as AuthState, user: null as User | null },
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

const testUser: User = {
  email: "a@b.c",
  token: "token",
  username: "tester",
  bio: null,
  image: null,
};

let root: Root | null = null;

async function render(state: AuthState, user: User | null = null) {
  auth.state = state;
  auth.user = user;
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
  });
  return container;
}

function navHrefs(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll("a.nav-link")].map((a) => a.getAttribute("href"));
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe("Navbar", () => {
  it("shows Home / Sign in / Sign up when unauthenticated", async () => {
    const container = await render("unauthenticated");

    expect(navHrefs(container)).toEqual(["/", "/login", "/register"]);
  });

  it("shows Home / New Article / Settings / profile when authenticated", async () => {
    const container = await render("authenticated", testUser);

    expect(navHrefs(container)).toEqual(["/", "/editor", "/settings", "/profile/tester"]);
  });

  it("falls back to the default avatar when user.image is null", async () => {
    const container = await render("authenticated", testUser);

    const img = container.querySelector("img.user-pic");
    expect(img?.getAttribute("src")).toBe(DEFAULT_AVATAR);
  });
});
