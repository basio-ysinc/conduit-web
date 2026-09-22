// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../src/api/client";
import type { User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { Register } from "../src/pages/Register";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { signIn: vi.fn(), setUser: vi.fn(), signOut: vi.fn() },
  apiMock: { register: vi.fn() },
}));

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: "unauthenticated",
    user: null,
    signIn: auth.signIn,
    setUser: auth.setUser,
    signOut: auth.signOut,
  }),
}));

vi.mock("../src/api/client", async (importActual) => {
  const actual = await importActual<typeof import("../src/api/client")>();
  return { ...actual, api: { ...actual.api, register: apiMock.register } };
});

const testUser: User = {
  email: "a@b.c",
  token: "token",
  username: "tester",
  bio: null,
  image: null,
};

let root: Root | null = null;

async function render() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

function fill(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`input[name="${name}"] not found`);
  input.value = value;
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

describe("Register", () => {
  it("renders the Sign up form per the selectors contract", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe("Sign up");
    expect(container.querySelector('input[name="username"]')).not.toBeNull();
    expect(container.querySelector('input[name="email"]')).not.toBeNull();
    expect(container.querySelector('input[name="password"]')).not.toBeNull();
  });

  it("signs in and navigates home on success", async () => {
    apiMock.register.mockResolvedValue(testUser);
    const container = await render();
    fill(container, "username", "tester");
    fill(container, "email", "a@b.c");
    fill(container, "password", "password123");

    await submit(container);

    expect(apiMock.register).toHaveBeenCalledWith({
      username: "tester",
      email: "a@b.c",
      password: "password123",
    });
    expect(auth.signIn).toHaveBeenCalledWith(testUser);
    expect(container.textContent).toBe("HOME");
  });

  it("shows each field error in .error-messages on 422", async () => {
    apiMock.register.mockRejectedValue(
      new ApiError(409, {
        email: ["has already been taken"],
        username: ["has already been taken"],
      }),
    );
    const container = await render();

    await submit(container);

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["email has already been taken", "username has already been taken"]);
    expect(auth.signIn).not.toHaveBeenCalled();
  });
});
