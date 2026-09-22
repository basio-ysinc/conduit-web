import { describe, expect, it } from "vitest";
import { API_URL } from "../src/api/config";

describe("api config", () => {
  it("defaults to the same-origin /api path (proxied to conduit-api)", () => {
    expect(API_URL).toBe("/api");
  });
});
