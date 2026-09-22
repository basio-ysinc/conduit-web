// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { User } from "../src/api/types";
import type { AuthContextValue, AuthState } from "../src/auth/AuthContext";
import { RequireAuth } from "../src/components/RequireAuth";

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

describe("RequireAuth", () => {
  it("redirects to /login when unauthenticated", async () => {
    auth.state = "unauthenticated";
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/settings"]}>
          <Routes>
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <div>settings page</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toBe("login page");
    act(() => root.unmount());
  });
});
