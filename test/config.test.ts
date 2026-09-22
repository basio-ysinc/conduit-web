import { describe, expect, it } from "vitest";
import { API_URL } from "../src/api/config";

describe("api config", () => {
  it("uses the same-origin /api proxy path by default", () => {
    expect(API_URL).toBe("/api");
  });
});
