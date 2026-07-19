const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");

const {
  readSqliteSummary,
  readSqliteTableData,
} = require("../../lib/server/routes/browse/sqlite");

describe("server/routes/browse sqlite runtime unavailable", () => {
  const targetPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-sqlite-unavail-")),
    "data.sqlite",
  );
  const originalLoad = Module._load;

  beforeEach(() => {
    Module._load = function patchedLoad(request, ...rest) {
      if (request === "node:sqlite") {
        throw new Error("node:sqlite unavailable in this test");
      }
      return originalLoad.call(this, request, ...rest);
    };
  });

  afterEach(() => {
    Module._load = originalLoad;
  });

  it("throws a friendly error from readSqliteSummary", () => {
    expect(() => readSqliteSummary(targetPath)).toThrow(
      "SQLite preview is unavailable on this Node runtime",
    );
  });

  it("returns a friendly error from readSqliteTableData", () => {
    const result = readSqliteTableData(targetPath, "users", "10", "0");
    expect(result).toEqual({
      ok: false,
      error: "SQLite preview is unavailable on this Node runtime",
    });
  });
});
