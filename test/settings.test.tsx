// @vitest-environment happy-dom
import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../src/api/client";
import type { User } from "../src/api/types";
import type { AuthContextValue } from "../src/auth/AuthContext";
import { Settings } from "../src/pages/Settings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { auth, apiMock } = vi.hoisted(() => ({
  auth: { signIn: vi.fn(), setUser: vi.fn(), signOut: vi.fn() },
  apiMock: { updateCurrentUser: vi.fn() },
}));

const currentUser: User = {
  email: "a@b.c",
  token: "token",
  username: "tester",
  bio: "old bio",
  image: null,
};

vi.mock("../src/auth/AuthContext", () => ({
  useAuth: (): AuthContextValue => ({
    state: "authenticated",
    user: currentUser,
    signIn: auth.signIn,
    setUser: auth.setUser,
    signOut: auth.signOut,
  }),
}));

vi.mock("../src/api/client", async (importActual) => {
  const actual = await importActual<typeof import("../src/api/client")>();
  return { ...actual, api: { ...actual.api, updateCurrentUser: apiMock.updateCurrentUser } };
});

let root: Root | null = null;

async function render() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<div>HOME</div>} />
          <Route path="/profile/:username" element={<div>PROFILE</div>} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

function fill(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  if (!input) throw new Error(`[name="${name}"] not found`);
  input.value = value;
}

async function submit(container: HTMLElement) {
  const form = container.querySelector("form");
  await act(async () => {
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function clickLogout(container: HTMLElement) {
  const button = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "Or click here to logout",
  );
  if (!button) throw new Error("logout button not found");
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.clearAllMocks();
});

describe("Settings", () => {
  it("renders the form prefilled with the current user per the selectors contract", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe("Your Settings");
    expect(container.querySelector<HTMLInputElement>('input[name="image"]')?.value).toBe("");
    expect(container.querySelector<HTMLInputElement>('input[name="username"]')?.value).toBe(
      "tester",
    );
    expect(container.querySelector<HTMLTextAreaElement>('textarea[name="bio"]')?.value).toBe(
      "old bio",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe("a@b.c");
    expect(container.querySelector<HTMLInputElement>('input[name="password"]')?.value).toBe("");
  });

  it("updates the user and navigates to the profile on success", async () => {
    const updated: User = { ...currentUser, bio: "new bio" };
    apiMock.updateCurrentUser.mockResolvedValue(updated);
    const container = await render();
    fill(container, "bio", "new bio");

    await submit(container);

    expect(apiMock.updateCurrentUser).toHaveBeenCalledWith({
      image: "",
      username: "tester",
      bio: "new bio",
      email: "a@b.c",
    });
    expect(auth.setUser).toHaveBeenCalledWith(updated);
    expect(container.textContent).toBe("PROFILE");
  });

  it("sends password only when a new one is entered", async () => {
    apiMock.updateCurrentUser.mockResolvedValue(currentUser);
    const container = await render();
    fill(container, "password", "newpassword1");

    await submit(container);

    expect(apiMock.updateCurrentUser).toHaveBeenCalledWith({
      image: "",
      username: "tester",
      bio: "old bio",
      email: "a@b.c",
      password: "newpassword1",
    });
  });

  it("shows each field error in .error-messages on failure", async () => {
    apiMock.updateCurrentUser.mockRejectedValue(
      new ApiError(409, { username: ["has already been taken"] }),
    );
    const container = await render();

    await submit(container);

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["username has already been taken"]);
    expect(auth.setUser).not.toHaveBeenCalled();
  });

  it("logs out and navigates home via the logout button", async () => {
    const container = await render();

    await clickLogout(container);

    expect(auth.signOut).toHaveBeenCalled();
    expect(container.textContent).toBe("HOME");
  });
});
