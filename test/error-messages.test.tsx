// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { ErrorMessages } from "../src/components/ErrorMessages";

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
