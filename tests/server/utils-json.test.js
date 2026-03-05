const {
  parseJsonSafe,
  parseJsonObjectFromNoisyOutput,
} = require("../../lib/server/utils/json");

describe("server/utils/json", () => {
  it("parses JSON safely with fallback", () => {
    expect(parseJsonSafe('{"ok":true}', null)).toEqual({ ok: true });
    expect(parseJsonSafe("not-json", { ok: false })).toEqual({ ok: false });
    expect(parseJsonSafe("", { ok: false })).toEqual({ ok: false });
  });

  it("supports trim option for parseJsonSafe", () => {
    expect(parseJsonSafe(' \n {"count":2} \t ', null, { trim: true })).toEqual({
      count: 2,
    });
  });

  it("extracts JSON object from noisy output", () => {
    expect(
      parseJsonObjectFromNoisyOutput('prefix\n{"ok":true,"count":2}\nsuffix'),
    ).toEqual({
      ok: true,
      count: 2,
    });
    expect(parseJsonObjectFromNoisyOutput("no braces")).toBeNull();
  });
});
