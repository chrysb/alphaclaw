const path = require("path");

const {
  createWebhook,
  deleteWebhook,
  ensureWebhookMappingIds,
  getWebhookDetail,
  listWebhooks,
  updateWebhookDestination,
  validateWebhookName,
  getTransformRelativePath,
} = require("../../lib/server/webhooks");

const openclawDir = "/tmp/openclaw-webhooks-unit";
const configPath = path.join(openclawDir, "openclaw.json");
const constants = { OPENCLAW_DIR: openclawDir };

const createMemoryFs = (initialFiles = {}, { rmWorks = true } = {}) => {
  const files = new Map(
    Object.entries(initialFiles).map(([filePath, contents]) => [
      filePath,
      String(contents),
    ]),
  );

  return {
    files,
    existsSync: (filePath) => files.has(filePath),
    readFileSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
    },
    mkdirSync: () => {},
    rmSync: (dirPath) => {
      if (!rmWorks) return;
      for (const filePath of [...files.keys()]) {
        if (filePath === dirPath || filePath.startsWith(`${dirPath}/`)) {
          files.delete(filePath);
        }
      }
    },
    statSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return {
        birthtime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
        ctime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
      };
    },
  };
};

const createConfigFs = (config = { agents: { list: [{ id: "main", default: true }] } }) =>
  createMemoryFs({ [configPath]: JSON.stringify(config) });

const readStoredConfig = (fs) => JSON.parse(fs.files.get(configPath));

describe("server/webhooks coverage", () => {
  describe("validateWebhookName", () => {
    it("normalizes case and whitespace", () => {
      expect(validateWebhookName("  My-Hook ")).toBe("my-hook");
    });

    it("rejects blank and malformed names", () => {
      expect(() => validateWebhookName("  ")).toThrow("Webhook name is required");
      expect(() => validateWebhookName("bad_name")).toThrow(
        "lowercase letters, numbers, and hyphens",
      );
    });
  });

  describe("createWebhook", () => {
    it("throws when the config cannot be read", () => {
      expect(() =>
        createWebhook({ fs: createMemoryFs(), constants, name: "x-hook" }),
      ).toThrow("Could not read openclaw.json");
    });

    it("rejects destinations with a channel but no target", () => {
      const fs = createConfigFs();
      expect(() =>
        createWebhook({
          fs,
          constants,
          name: "half-dest",
          destination: { channel: "telegram" },
        }),
      ).toThrow("destination.channel and destination.to are required");
    });

    it("refuses managed webhook names unless explicitly allowed", () => {
      const fs = createConfigFs({ hooks: { presets: ["gmail"] } });
      expect(() => createWebhook({ fs, constants, name: "gmail" })).toThrow(
        'Webhook "gmail" is managed and cannot be created manually',
      );

      const detail = createWebhook({
        fs,
        constants,
        name: "gmail",
        allowManagedName: true,
      });
      expect(detail.managed).toBe(true);
      expect(detail.transformExists).toBe(true);
      expect(detail.managedReason).toContain("Gmail Watch");
    });

    it("throws for duplicates and updates in place with upsert", () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "dupe" });
      expect(() => createWebhook({ fs, constants, name: "dupe" })).toThrow(
        'Webhook "dupe" already exists',
      );

      const updated = createWebhook({
        fs,
        constants,
        name: "dupe",
        upsert: true,
        mapping: { wakeMode: "next-heartbeat", channel: "telegram", to: "123" },
      });
      expect(updated.channel).toBe("telegram");
      expect(updated.to).toBe("123");
      const mapping = readStoredConfig(fs).hooks.mappings.find(
        (entry) => entry?.match?.path === "dupe",
      );
      expect(mapping.wakeMode).toBe("next-heartbeat");

      // Re-upserting the identical mapping keeps everything unchanged.
      const unchanged = createWebhook({
        fs,
        constants,
        name: "dupe",
        upsert: true,
        mapping: { wakeMode: "next-heartbeat", channel: "telegram", to: "123" },
      });
      expect(unchanged.channel).toBe("telegram");
    });

    it("overwrites the transform only when requested", () => {
      const fs = createConfigFs();
      const transformPath = path.join(
        openclawDir,
        getTransformRelativePath("source-hook"),
      );
      createWebhook({ fs, constants, name: "source-hook" });
      const original = fs.files.get(transformPath);
      expect(original).toContain("export default async function transform");

      createWebhook({
        fs,
        constants,
        name: "source-hook",
        upsert: true,
        transformSource: "export default () => ({ message: 'custom' });   ",
      });
      expect(fs.files.get(transformPath)).toBe(original);

      createWebhook({
        fs,
        constants,
        name: "source-hook",
        upsert: true,
        transformSource: "export default () => ({ message: 'custom' });   ",
        overwriteTransform: true,
      });
      expect(fs.files.get(transformPath)).toBe(
        "export default () => ({ message: 'custom' });\n",
      );
    });

    it("normalizes hooks root defaults and preserves custom prefixes", () => {
      const fs = createConfigFs({
        hooks: {
          enabled: false,
          path: "  ",
          token: 42,
          defaultSessionKey: "",
          allowRequestSessionKey: "yes",
          allowedSessionKeyPrefixes: ["custom:"],
        },
      });
      createWebhook({ fs, constants, name: "root-hook" });
      const stored = readStoredConfig(fs);
      expect(stored.hooks.enabled).toBe(false);
      expect(stored.hooks.path).toBe("/hooks");
      expect(stored.hooks.token).toBe("${WEBHOOK_TOKEN}");
      expect(stored.hooks.defaultSessionKey).toBe("hook:ingress");
      expect(stored.hooks.allowRequestSessionKey).toBe(false);
      expect(stored.hooks.allowedSessionKeyPrefixes).toEqual([
        "custom:",
        "hook:",
      ]);
    });

    it("falls back to the first agent and then to main", () => {
      const noDefaultFs = createConfigFs({
        agents: { list: [{ id: "alpha" }, { id: "beta" }] },
      });
      createWebhook({ fs: noDefaultFs, constants, name: "first-agent" });
      expect(
        readStoredConfig(noDefaultFs).hooks.mappings[0].agentId,
      ).toBe("alpha");

      const emptyFs = createConfigFs({});
      createWebhook({ fs: emptyFs, constants, name: "main-agent" });
      expect(readStoredConfig(emptyFs).hooks.mappings[0].agentId).toBe("main");
    });
  });

  describe("listWebhooks and getWebhookDetail", () => {
    it("lists synthetic managed webhooks alongside mapping webhooks", () => {
      const fs = createConfigFs({
        agents: { list: [{ id: "main", default: true }] },
        hooks: { presets: ["gmail"] },
      });
      createWebhook({ fs, constants, name: "regular-hook" });
      const hooks = listWebhooks({ fs, constants });
      expect(hooks.map((hook) => hook.name)).toEqual(["gmail", "regular-hook"]);
      const gmail = hooks.find((hook) => hook.name === "gmail");
      expect(gmail).toEqual(
        expect.objectContaining({
          managed: true,
          transformPath: null,
          transformExists: true,
          path: "/hooks/gmail",
        }),
      );
    });

    it("does not duplicate managed webhooks that also have mappings", () => {
      const fs = createConfigFs({
        agents: { list: [{ id: "main", default: true }] },
        hooks: { presets: ["gmail"] },
      });
      createWebhook({ fs, constants, name: "gmail", allowManagedName: true });
      const hooks = listWebhooks({ fs, constants });
      expect(hooks.filter((hook) => hook.name === "gmail")).toHaveLength(1);
      expect(hooks[0].managed).toBe(true);
      expect(hooks[0].transformPath).toBe(getTransformRelativePath("gmail"));
    });

    it("marks missing transform files with a null createdAt", () => {
      const fs = createConfigFs({
        hooks: {
          mappings: [{ id: "manual", match: { path: "manual" }, action: "agent" }],
        },
      });
      const hooks = listWebhooks({ fs, constants });
      expect(hooks).toHaveLength(1);
      expect(hooks[0].createdAt).toBe(null);
      expect(hooks[0].transformExists).toBe(false);

      const detail = getWebhookDetail({ fs, constants, name: "manual" });
      expect(detail.transformExists).toBe(false);
    });

    it("returns null for unknown webhook details", () => {
      const fs = createConfigFs();
      expect(getWebhookDetail({ fs, constants, name: "ghost" })).toBe(null);
    });
  });

  describe("updateWebhookDestination", () => {
    it("refuses to update managed webhooks", () => {
      const fs = createConfigFs({ hooks: { presets: ["gmail"] } });
      expect(() =>
        updateWebhookDestination({ fs, constants, name: "gmail" }),
      ).toThrow('Webhook "gmail" is managed and cannot be updated manually');
    });

    it("throws when the webhook is missing", () => {
      const fs = createConfigFs();
      expect(() =>
        updateWebhookDestination({ fs, constants, name: "ghost" }),
      ).toThrow("Webhook not found");
    });

    it("skips writes when nothing changed", () => {
      const fs = createConfigFs();
      createWebhook({
        fs,
        constants,
        name: "stable",
        destination: { channel: "direct", to: "sess" },
      });
      const first = updateWebhookDestination({
        fs,
        constants,
        name: "stable",
        destination: { channel: "direct", to: "sess" },
      });
      const writeSpy = vi.fn(fs.writeFileSync);
      fs.writeFileSync = writeSpy;
      const second = updateWebhookDestination({
        fs,
        constants,
        name: "stable",
        destination: { channel: "direct", to: "sess" },
      });
      expect(first.to).toBe("sess");
      expect(second.to).toBe("sess");
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it("normalizes legacy transform module paths while updating", () => {
      const fs = createConfigFs({
        agents: { list: [{ id: "main", default: true }] },
        hooks: {
          mappings: [
            {
              id: "legacy",
              match: { path: "legacy" },
              action: "agent",
              transform: { module: "hooks/transforms/legacy/legacy-transform.mjs" },
            },
          ],
        },
      });
      const detail = updateWebhookDestination({
        fs,
        constants,
        name: "legacy",
        destination: null,
      });
      expect(detail.transformPath).toBe(getTransformRelativePath("legacy"));
      const stored = readStoredConfig(fs);
      expect(stored.hooks.mappings[0].transform.module).toBe(
        "legacy/legacy-transform.mjs",
      );
    });
  });

  describe("deleteWebhook", () => {
    it("reports managed webhooks without removing them", () => {
      const fs = createConfigFs({ hooks: { presets: ["gmail"] } });
      expect(deleteWebhook({ fs, constants, name: "gmail" })).toEqual({
        removed: false,
        managed: true,
        deletedTransformDir: false,
      });
    });

    it("returns false and persists normalization when the mapping is missing", () => {
      const fs = createConfigFs({
        hooks: {
          mappings: [
            {
              id: "other",
              match: { path: "other" },
              action: "agent",
              transform: { module: "hooks/transforms/other/other-transform.mjs" },
            },
          ],
        },
      });
      expect(deleteWebhook({ fs, constants, name: "missing" })).toBe(false);
      expect(readStoredConfig(fs).hooks.mappings[0].transform.module).toBe(
        "other/other-transform.mjs",
      );

      // Second call: no normalization left, still missing, no write.
      const writeSpy = vi.fn(fs.writeFileSync);
      fs.writeFileSync = writeSpy;
      expect(deleteWebhook({ fs, constants, name: "missing" })).toBe(false);
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it("keeps the transform directory by default", () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "keep-dir" });
      const result = deleteWebhook({ fs, constants, name: "keep-dir" });
      expect(result).toEqual({ removed: true, deletedTransformDir: false });
      const transformPath = path.join(
        openclawDir,
        getTransformRelativePath("keep-dir"),
      );
      expect(fs.files.has(transformPath)).toBe(true);
    });

    it("removes the transform directory when requested", () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "rm-dir" });
      const transformDir = path.join(openclawDir, "hooks/transforms/rm-dir");
      fs.files.set(transformDir, "");
      const result = deleteWebhook({
        fs,
        constants,
        name: "rm-dir",
        deleteTransformDir: true,
      });
      expect(result).toEqual({ removed: true, deletedTransformDir: true });
      expect(fs.files.has(transformDir)).toBe(false);
      expect(readStoredConfig(fs).hooks.mappings).toEqual([]);
    });

    it("skips directory removal when the directory does not exist", () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "no-dir" });
      const result = deleteWebhook({
        fs,
        constants,
        name: "no-dir",
        deleteTransformDir: true,
      });
      expect(result).toEqual({ removed: true, deletedTransformDir: false });
    });

    it("throws when the transform directory cannot be deleted", () => {
      const fs = createMemoryFs(
        { [configPath]: JSON.stringify({}) },
        { rmWorks: false },
      );
      createWebhook({ fs, constants, name: "stuck-dir" });
      const transformDir = path.join(openclawDir, "hooks/transforms/stuck-dir");
      fs.files.set(transformDir, "");
      expect(() =>
        deleteWebhook({
          fs,
          constants,
          name: "stuck-dir",
          deleteTransformDir: true,
        }),
      ).toThrow(
        "Failed to delete transform directory: hooks/transforms/stuck-dir",
      );
    });
  });

  describe("ensureWebhookMappingIds", () => {
    it("skips non-object mapping entries", () => {
      const fs = createConfigFs({
        hooks: {
          mappings: [
            null,
            "junk",
            [1, 2],
            { match: { path: "real" }, action: "agent" },
          ],
        },
      });
      expect(ensureWebhookMappingIds({ fs, constants })).toEqual({
        changed: true,
        updatedIds: ["real"],
      });
    });
  });
});
