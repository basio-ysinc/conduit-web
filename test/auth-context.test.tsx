// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../src/api/types";
import { type AuthContextValue, AuthProvider, useAuth } from "../src/auth/AuthContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
let auth: AuthContextValue | null = null;
let root: Root | null = null;

function Consumer() {
  auth = useAuth();
  return null;
}

async function render() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
  });
}

function userResponse(user: Partial<User> = {}, status = 200): Response {
  const u: User = {
    email: "a@b.c",
    token: "new-token",
    username: "tester",
    bio: null,
    image: null,
    ...user,
  };
  return new Response(JSON.stringify({ user: u }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  auth = null;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  window.__conduit_debug__ = undefined;
});

describe("AuthProvider", () => {
  it("starts unauthenticated when no token is stored", async () => {
    await render();

    expect(auth?.state).toBe("unauthenticated");
    expect(auth?.user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restores the session from a stored token", async () => {
    localStorage.setItem("jwtToken", "stored-token");
    fetchMock.mockResolvedValue(userResponse({ token: "refreshed-token" }));

    await render();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Token stored-token");
    expect(auth?.state).toBe("authenticated");
    expect(auth?.user?.username).toBe("tester");
    // サーバーが返した最新 token で保存し直す
    expect(localStorage.getItem("jwtToken")).toBe("refreshed-token");
  });

  it("clears an invalid stored token and becomes unauthenticated", async () => {
    localStorage.setItem("jwtToken", "bad-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ errors: { token: ["is invalid"] } }), { status: 401 }),
    );

    await render();

    expect(auth?.state).toBe("unauthenticated");
    expect(auth?.user).toBeNull();
    expect(localStorage.getItem("jwtToken")).toBeNull();
  });

  it("signIn stores the token and marks the user authenticated", async () => {
    await render();
    const user: User = {
      email: "a@b.c",
      token: "login-token",
      username: "tester",
      bio: null,
      image: null,
    };

    act(() => auth?.signIn(user));

    expect(auth?.state).toBe("authenticated");
    expect(auth?.user).toEqual(user);
    expect(localStorage.getItem("jwtToken")).toBe("login-token");
  });

  it("signOut clears the token and user", async () => {
    localStorage.setItem("jwtToken", "stored-token");
    fetchMock.mockResolvedValue(userResponse());
    await render();

    act(() => auth?.signOut());

    expect(auth?.state).toBe("unauthenticated");
    expect(auth?.user).toBeNull();
    expect(localStorage.getItem("jwtToken")).toBeNull();
  });

  it("exposes window.__conduit_debug__ per the e2e contract", async () => {
    localStorage.setItem("jwtToken", "stored-token");
    fetchMock.mockResolvedValue(userResponse({ username: "dbg" }));

    await render();

    const debug = window.__conduit_debug__;
    expect(debug).toBeDefined();
    expect(debug?.getAuthState()).toBe("authenticated");
    expect(debug?.getToken()).toBe(localStorage.getItem("jwtToken"));
    expect(debug?.getCurrentUser()?.username).toBe("dbg");
  });
});
