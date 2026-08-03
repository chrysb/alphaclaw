import { describe, expect, it } from "vitest";
import { looksLikeProjectNumber } from "../../lib/public/js/components/google/project-id.js";

describe("looksLikeProjectNumber", () => {
  it("flags a bare numeric project number", () => {
    expect(looksLikeProjectNumber("1030476043583")).toBe(true);
  });

  it("accepts a real project ID with letters", () => {
    expect(looksLikeProjectNumber("claude-email-487317")).toBe(false);
  });
});
