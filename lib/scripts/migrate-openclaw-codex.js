#!/usr/bin/env node

const { migrateLegacyCodexState } = require("../server/openclaw-codex-migration");

migrateLegacyCodexState()
  .then((result) => {
    if (result.changed) {
      console.log("[alphaclaw] Migrated legacy OpenAI Codex model and auth state");
    }
    for (const warning of result.warnings) {
      console.warn(`[alphaclaw] Codex migration warning: ${warning}`);
    }
  })
  .catch((error) => {
    console.error(`[alphaclaw] Codex migration failed: ${error.message}`);
    process.exitCode = 1;
  });
