import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.js"],
    restoreMocks: true,
    clearMocks: true,
    // Tests that touch the openclaw plugin-sdk pay a >5s dynamic-import cost
    // on first load per worker, which flakes under parallel machine load.
    testTimeout: 30000,
  },
});
