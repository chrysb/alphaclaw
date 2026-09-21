import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, "..", "..");
const publicRoot = path.join(projectRoot, "lib", "public");

const requiredAssets = [
  "css/tailwind.generated.css",
  "css/vendor/xterm.css",
  "dist/app.bundle.js",
];

describe("UI runtime assets", () => {
  it.each(requiredAssets)("ships %s in a source checkout", async (asset) => {
    await expect(access(path.join(publicRoot, asset))).resolves.toBeUndefined();
  });

  it("keeps the setup entrypoint aligned with the shipped bundle", async () => {
    const setupHtml = await readFile(path.join(publicRoot, "setup.html"), "utf8");
    expect(setupHtml).toContain('src="./dist/app.bundle.js"');
  });
});
