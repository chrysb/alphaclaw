import { describe, expect, it, vi } from "vitest";

// loadXtermModules memoizes its promise per module instance, so the
// missing-FitAddon failure path needs its own test file (fresh module).
vi.mock("@xterm/xterm", () => ({
  Terminal: null,
  default: { Terminal: class Terminal {} },
}));
vi.mock("@xterm/addon-fit", () => ({ FitAddon: null, default: {} }));

import { loadXtermModules } from "../../lib/public/js/components/watchdog-tab/helpers.js";

describe("frontend/watchdog-helpers xterm missing FitAddon", () => {
  it("rejects when the FitAddon export cannot be found", async () => {
    await expect(loadXtermModules()).rejects.toThrow(
      "Xterm FitAddon export not found",
    );
  });
});
