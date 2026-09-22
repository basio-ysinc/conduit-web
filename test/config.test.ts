import { describe, expect, it } from "vitest";
import { API_URL } from "../src/api/config";

describe("api config", () => {
  it("has a default API URL", () => {
    expect(API_URL).toMatch(/^https?:\/\//);
  });
});
