const expressPackage = require("express/package.json");

describe("server runtime dependency guard", () => {
  it("resolves express v5 at top-level runtime", () => {
    const majorVersion = Number.parseInt(
      String(expressPackage.version || "").split(".")[0] || "0",
      10,
    );
    expect(majorVersion).toBe(5);
  });
});
