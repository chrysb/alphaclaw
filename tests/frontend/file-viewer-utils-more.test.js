import { describe, expect, it } from "vitest";
import {
  clampSelectionIndex,
  parsePathSegments,
} from "../../lib/public/js/components/file-viewer/utils.js";

describe("frontend/file-viewer-utils (extended)", () => {
  it("parses path segments, trimming and dropping empties", () => {
    expect(parsePathSegments("a//b/ c /")).toEqual(["a", "b", "c"]);
    expect(parsePathSegments("")).toEqual([]);
    expect(parsePathSegments(null)).toEqual([]);
  });

  it("clamps selection indexes to the valid range", () => {
    expect(clampSelectionIndex("3", 5)).toBe(3);
    expect(clampSelectionIndex(9, 5)).toBe(5);
    expect(clampSelectionIndex(-2, 5)).toBe(0);
    expect(clampSelectionIndex("not-a-number", 5)).toBe(0);
    expect(clampSelectionIndex(undefined, 5)).toBe(0);
  });
});
