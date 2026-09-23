// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { ApiError } from "../src/api/client";
import { ErrorMessages, toErrors } from "../src/components/ErrorMessages";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render(errors: Parameters<typeof ErrorMessages>[0]["errors"]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(<ErrorMessages errors={errors} />);
  });
  return container;
}

describe("ErrorMessages", () => {
  it("renders each field error as an li in .error-messages", async () => {
    const container = await render({
      email: ["is invalid", "is taken"],
      title: ["can't be blank"],
    });

    const items = [...container.querySelectorAll("ul.error-messages li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["email is invalid", "email is taken", "title can't be blank"]);
  });

  it("renders nothing when there are no errors", async () => {
    const container = await render({});
    expect(container.querySelector(".error-messages")).toBeNull();

    const empty = await render(null);
    expect(empty.querySelector(".error-messages")).toBeNull();
  });
});

describe("toErrors", () => {
  it("returns the server's errors when ApiError carries them", () => {
    const errors = { email: ["is invalid"], title: ["can't be blank"] };
    expect(toErrors(new ApiError(422, errors))).toEqual(errors);
  });

  it("falls back to a status message when ApiError has no errors", () => {
    expect(toErrors(new ApiError(503, {}))).toEqual({
      error: ["Request failed with status 503"],
    });
  });

  it("maps non-HTTP errors to a connection error", () => {
    expect(toErrors(new TypeError("Failed to fetch"))).toEqual({
      error: ["Unable to connect to the server. Please check your connection and try again."],
    });
  });
});
