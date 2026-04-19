const path = require("path");
const { getBinPath } = require("../../lib/platform");

describe("getBinPath", () => {
  const fakeHome = "/fakehome";

  it("returns ~/.local/bin on darwin when /usr/local/bin is unwritable", () => {
    const result = getBinPath({
      platform: "darwin",
      isWritable: () => false,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe(path.join(fakeHome, ".local", "bin"));
  });

  it("returns /usr/local/bin on linux when writable", () => {
    const result = getBinPath({
      platform: "linux",
      isWritable: () => true,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe("/usr/local/bin");
  });

  it("returns managedBinDir on linux when /usr/local/bin is unwritable", () => {
    const result = getBinPath({
      platform: "linux",
      isWritable: () => false,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe("/managed/bin");
  });

  it("returns ~/.local/bin on darwin even when /usr/local/bin is writable (root)", () => {
    const result = getBinPath({
      platform: "darwin",
      isWritable: () => true,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe(path.join(fakeHome, ".local", "bin"));
  });
});
