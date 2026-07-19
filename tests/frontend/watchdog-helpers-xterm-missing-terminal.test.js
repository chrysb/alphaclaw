import { describe, expect, it, vi } from "vitest";

// loadXtermModules memoizes its promise per module instance, so the
// missing-Terminal failure path needs its own test file (fresh module).
vi.mock("@xterm/xterm", () => ({ Terminal: null, default: {} }));
vi.mock("@xterm/addon-fit", () => ({ FitAddon: class FitAddon {} }));

import { loadXtermModules } from "../../lib/public/js/components/watchdog-tab/helpers.js";

describe("frontend/watchdog-helpers xterm missing Terminal", () => {
  it("rejects when the Terminal export cannot be found", async () => {
    await expect(loadXtermModules()).rejects.toThrow(
      "Xterm Terminal export not found",
    );
  });
});
