const {
  isTruthyFlag,
  parseBooleanValue,
} = require("../../lib/server/utils/boolean");

describe("server/utils/boolean", () => {
  it("detects truthy flags from common string tokens", () => {
    expect(isTruthyFlag("true")).toBe(true);
    expect(isTruthyFlag(" YES ")).toBe(true);
    expect(isTruthyFlag("on")).toBe(true);
    expect(isTruthyFlag("1")).toBe(true);
    expect(isTruthyFlag("false")).toBe(false);
    expect(isTruthyFlag("0")).toBe(false);
    expect(isTruthyFlag("")).toBe(false);
  });

  it("coerces booleans with fallback behavior", () => {
    expect(parseBooleanValue(true, false)).toBe(true);
    expect(parseBooleanValue(false, true)).toBe(false);
    expect(parseBooleanValue(1, false)).toBe(true);
    expect(parseBooleanValue(0, true)).toBe(false);
    expect(parseBooleanValue("off", true)).toBe(false);
    expect(parseBooleanValue("nope", true)).toBe(true);
  });
});
