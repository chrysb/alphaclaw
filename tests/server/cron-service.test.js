const fs = require("fs");
const os = require("os");
const path = require("path");
const { createCronService } = require("../../lib/server/cron-service");

const createOpenclawDirWithCronJobs = (jobs = []) => {
  const openclawDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-cron-"));
  fs.mkdirSync(path.join(openclawDir, "cron"), { recursive: true });
  fs.writeFileSync(
    path.join(openclawDir, "cron", "jobs.json"),
    JSON.stringify({ version: 1, jobs }),
    "utf8",
  );
  return openclawDir;
};

const createOpenclawDirWithRawStore = (rawContents) => {
  const openclawDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-cron-"));
  fs.mkdirSync(path.join(openclawDir, "cron"), { recursive: true });
  if (rawContents != null) {
    fs.writeFileSync(path.join(openclawDir, "cron", "jobs.json"), rawContents, "utf8");
  }
  return openclawDir;
};

const writeRunLog = (openclawDir, jobId, entries = []) => {
  const runsDir = path.join(openclawDir, "cron", "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const lines = entries.map((entry) =>
    typeof entry === "string" ? entry : JSON.stringify(entry));
  fs.writeFileSync(
    path.join(runsDir, `${jobId}.jsonl`),
    `${lines.join("\n")}\n`,
    "utf8",
  );
};

const makeService = (openclawDir, overrides = {}) =>
  createCronService({
    clawCmd: vi.fn(async () => ({ ok: true, stdout: "" })),
    OPENCLAW_DIR: openclawDir,
    getSessionUsageByKeyPattern: vi.fn(() => ({})),
    ...overrides,
  });

const finishedEntry = (jobId, overrides = {}) => ({
  action: "finished",
  jobId,
  ts: Date.now(),
  status: "ok",
  ...overrides,
});

describe("server/cron-service", () => {
  it("uses plain cron commands without --json for run/toggle/edit", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      {
        id: "job-a",
        name: "Job A",
        enabled: true,
        createdAtMs: 1,
        schedule: { kind: "cron", expr: "0 8 * * *" },
        sessionTarget: "isolated",
        wakeMode: "now",
        payload: { kind: "agentTurn", message: "old prompt" },
        state: {},
      },
    ]);
    const clawCmd = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, stdout: "ran job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "disabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "enabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "updated prompt" })
      .mockResolvedValueOnce({ ok: true, stdout: "updated routing" });
    try {
      const cronService = createCronService({
        clawCmd,
        OPENCLAW_DIR: openclawDir,
        getSessionUsageByKeyPattern: vi.fn(() => ({})),
      });

      const runResult = await cronService.runJobNow("job-a");
      expect(clawCmd).toHaveBeenCalledTimes(1);
      expect(clawCmd).toHaveBeenNthCalledWith(
        1,
        "cron run 'job-a'",
        expect.objectContaining({ quiet: true }),
      );
      expect(runResult.raw).toBe("ran job-a");

      const result = await cronService.setJobEnabled({
        jobId: "job-a",
        enabled: false,
      });

      expect(clawCmd).toHaveBeenCalledTimes(2);
      expect(clawCmd).toHaveBeenNthCalledWith(
        2,
        "cron disable 'job-a'",
        expect.objectContaining({ quiet: true }),
      );
      expect(result.raw).toBe("disabled job-a");
      expect(result.parsed).toBeNull();

      const secondResult = await cronService.setJobEnabled({
        jobId: "job-a",
        enabled: true,
      });
      expect(clawCmd).toHaveBeenCalledTimes(3);
      expect(clawCmd).toHaveBeenNthCalledWith(
        3,
        "cron enable 'job-a'",
        expect.objectContaining({ quiet: true }),
      );
      expect(secondResult.raw).toBe("enabled job-a");

      const promptResult = await cronService.updateJobPrompt({
        jobId: "job-a",
        message: "hello world",
      });
      expect(clawCmd).toHaveBeenCalledTimes(4);
      expect(clawCmd).toHaveBeenNthCalledWith(
        4,
        "cron edit 'job-a' --message 'hello world'",
        expect.objectContaining({ quiet: true }),
      );
      expect(promptResult.raw).toBe("updated prompt");

      const routingResult = await cronService.updateJobRouting({
        jobId: "job-a",
        sessionTarget: "isolated",
        wakeMode: "next-heartbeat",
        deliveryMode: "announce",
        deliveryChannel: "telegram",
        deliveryTo: "123",
      });
      expect(clawCmd).toHaveBeenCalledTimes(5);
      expect(clawCmd).toHaveBeenNthCalledWith(
        5,
        "cron edit 'job-a' --session 'isolated' --wake 'next-heartbeat' --announce --channel 'telegram' --to '123'",
        expect.objectContaining({ quiet: true }),
      );
      expect(routingResult.raw).toBe("updated routing");
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("uses --system-event when editing main systemEvent job prompts", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      {
        id: "job-main",
        name: "Main Job",
        enabled: true,
        createdAtMs: 1,
        schedule: { kind: "cron", expr: "0 8 * * *" },
        sessionTarget: "main",
        wakeMode: "now",
        payload: { kind: "systemEvent", text: "old prompt" },
        state: {},
      },
    ]);
    try {
      const clawCmd = vi.fn().mockResolvedValue({ ok: true, stdout: "updated prompt" });
      const cronService = createCronService({
        clawCmd,
        OPENCLAW_DIR: openclawDir,
        getSessionUsageByKeyPattern: vi.fn(() => ({})),
      });

      const result = await cronService.updateJobPrompt({
        jobId: "job-main",
        message: "new prompt",
      });

      expect(clawCmd).toHaveBeenCalledWith(
        "cron edit 'job-main' --system-event 'new prompt'",
        expect.objectContaining({ quiet: true }),
      );
      expect(result.raw).toBe("updated prompt");
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});

describe("server/cron-service listJobs + getStatus", () => {
  it("normalizes malformed stores to empty job lists", () => {
    const cases = [
      null, // missing file entirely
      "not json {{{",
      JSON.stringify({ jobs: "nope" }),
      JSON.stringify([1, 2, 3]),
      JSON.stringify("just a string"),
    ];
    for (const rawContents of cases) {
      const openclawDir = createOpenclawDirWithRawStore(rawContents);
      try {
        const service = makeService(openclawDir);
        const { jobs, storePath } = service.listJobs();
        expect(jobs).toEqual([]);
        expect(storePath).toBe(path.join(openclawDir, "cron", "jobs.json"));
        const status = service.getStatus();
        expect(status.jobs).toBe(0);
        expect(status.enabledJobs).toBe(0);
        expect(status.nextWakeAtMs).toBeNull();
        expect(status.enabled).toBe(true);
      } finally {
        fs.rmSync(openclawDir, { recursive: true, force: true });
      }
    }
  });

  it("filters invalid job entries and normalizes shapes", () => {
    const openclawDir = createOpenclawDirWithRawStore(
      JSON.stringify({
        jobs: [
          null,
          "string entry",
          42,
          { name: "no id" },
          { id: "   " },
          {
            id: " padded-id ",
            name: 123,
            enabled: false,
            state: "bad",
            payload: null,
            delivery: 7,
            schedule: "nope",
          },
        ],
      }),
    );
    try {
      const service = makeService(openclawDir);
      const { jobs } = service.listJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        id: "padded-id",
        name: "123",
        enabled: false,
        state: {},
        payload: {},
        delivery: {},
        schedule: {},
      });
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("sorts jobs by name, updatedAtMs, and nextRunAtMs in both directions", () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      { id: "b", name: "Bravo", updatedAtMs: 200, state: { nextRunAtMs: 3000 } },
      { id: "a", name: "alpha", updatedAtMs: 100, state: { nextRunAtMs: 1000 } },
      { id: "c", name: "alpha", updatedAtMs: 300, state: {} },
    ]);
    try {
      const service = makeService(openclawDir);

      const byNameAsc = service.listJobs({ sortBy: "name", sortDir: "asc" });
      expect(byNameAsc.jobs.map((job) => job.id)).toEqual(["a", "c", "b"]);

      const byNameDesc = service.listJobs({ sortBy: "name", sortDir: "desc" });
      expect(byNameDesc.jobs[0].id).toBe("b");

      const byUpdated = service.listJobs({ sortBy: "updatedAtMs", sortDir: "desc" });
      expect(byUpdated.jobs.map((job) => job.id)).toEqual(["c", "b", "a"]);

      const byNextRun = service.listJobs();
      expect(byNextRun.jobs.map((job) => job.id)).toEqual(["a", "b", "c"]);

      const byNextRunDesc = service.listJobs({ sortBy: "nextRunAtMs", sortDir: "desc" });
      expect(byNextRunDesc.jobs.map((job) => job.id)).toEqual(["c", "b", "a"]);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("computes next wake across enabled jobs only", () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      { id: "later", state: { nextRunAtMs: 2000 } },
      { id: "sooner", state: { nextRunAtMs: 1000 } },
      { id: "disabled", enabled: false, state: { nextRunAtMs: 500 } },
      { id: "unscheduled", state: {} },
    ]);
    try {
      const service = makeService(openclawDir);
      const status = service.getStatus();
      expect(status.jobs).toBe(4);
      expect(status.enabledJobs).toBe(3);
      expect(status.nextWakeAtMs).toBe(1000);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});

describe("server/cron-service command execution", () => {
  it("throws stderr, stdout, or a fallback message when commands fail", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const stderrService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: false, stderr: "boom stderr" })),
      });
      await expect(stderrService.runJobNow("job-a")).rejects.toThrow("boom stderr");

      const stdoutService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: false, stdout: "boom stdout" })),
      });
      await expect(stdoutService.runJobNow("job-a")).rejects.toThrow("boom stdout");

      const emptyService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: false })),
      });
      await expect(emptyService.runJobNow("job-a")).rejects.toThrow("Command failed");

      const whitespaceService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: false, stderr: "   " })),
      });
      await expect(whitespaceService.runJobNow("job-a")).rejects.toThrow("Command failed");

      const undefinedService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => undefined),
      });
      await expect(undefinedService.runJobNow("job-a")).rejects.toThrow("Command failed");
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("parses JSON payloads out of noisy stdout", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const jsonService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({
          ok: true,
          stdout: 'log noise\n{"ran": true, "count": 2}\ntrailing',
        })),
      });
      const jsonResult = await jsonService.runJobNow("job-a");
      expect(jsonResult.parsed).toMatchObject({ ran: true, count: 2 });

      const textService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: true, stdout: "plain text output" })),
      });
      const textResult = await textService.runJobNow("job-a");
      expect(textResult.parsed).toBeNull();
      expect(textResult.raw).toBe("plain text output");

      const emptyService = makeService(openclawDir, {
        clawCmd: vi.fn(async () => ({ ok: true })),
      });
      const emptyResult = await emptyService.runJobNow("job-a");
      expect(emptyResult.raw).toBe("");
      expect(emptyResult.parsed).toBeNull();
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("rejects invalid job ids", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const service = makeService(openclawDir);
      await expect(service.runJobNow("")).rejects.toThrow("Job id is required");
      await expect(service.runJobNow("   ")).rejects.toThrow("Job id is required");
      await expect(service.runJobNow("bad/id")).rejects.toThrow("Invalid job id");
      await expect(service.runJobNow("bad\\id")).rejects.toThrow("Invalid job id");
      await expect(service.runJobNow("bad\0id")).rejects.toThrow("Invalid job id");
      expect(() => service.getJobRuns({ jobId: "nested/../id" })).toThrow("Invalid job id");
      expect(() => service.getJobUsage({ jobId: "" })).toThrow("Job id is required");
      expect(() => service.getJobRunTrends({ jobId: "a/b" })).toThrow("Invalid job id");
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("escapes single quotes in shell arguments", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      {
        id: "job-a",
        name: "Job A",
        payload: { kind: "agentTurn", message: "old" },
        state: {},
      },
    ]);
    try {
      const clawCmd = vi.fn(async () => ({ ok: true, stdout: "ok" }));
      const service = makeService(openclawDir, { clawCmd });
      await service.updateJobPrompt({ jobId: "job-a", message: "it's tricky" });
      expect(clawCmd).toHaveBeenCalledWith(
        `cron edit 'job-a' --message 'it'\\''s tricky'`,
        expect.objectContaining({ quiet: true }),
      );
      await service.updateJobPrompt({ jobId: "job-a" });
      expect(clawCmd).toHaveBeenLastCalledWith(
        "cron edit 'job-a' --message ''",
        expect.objectContaining({ quiet: true }),
      );
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("rejects prompt updates for unknown jobs or unsupported payload kinds", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      { id: "weird", name: "Weird", payload: { kind: "otherKind" }, state: {} },
      { id: "kindless", name: "Kindless", payload: {}, state: {} },
    ]);
    try {
      const service = makeService(openclawDir);
      await expect(
        service.updateJobPrompt({ jobId: "ghost", message: "hi" }),
      ).rejects.toThrow("unknown cron job id: ghost");
      await expect(
        service.updateJobPrompt({ jobId: "weird", message: "hi" }),
      ).rejects.toThrow("unsupported cron payload kind: otherKind");
      await expect(
        service.updateJobPrompt({ jobId: "kindless", message: "hi" }),
      ).rejects.toThrow("unsupported cron payload kind: unknown");
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("validates routing fields and supports partial routing updates", async () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const clawCmd = vi.fn(async () => ({ ok: true, stdout: "ok" }));
      const service = makeService(openclawDir, { clawCmd });

      await expect(
        service.updateJobRouting({ jobId: "job-a", sessionTarget: "bogus" }),
      ).rejects.toThrow("sessionTarget must be main or isolated");
      await expect(
        service.updateJobRouting({ jobId: "job-a", wakeMode: "bogus" }),
      ).rejects.toThrow("wakeMode must be now or next-heartbeat");
      await expect(
        service.updateJobRouting({ jobId: "job-a", deliveryMode: "bogus" }),
      ).rejects.toThrow("deliveryMode must be announce or none");
      await expect(service.updateJobRouting({ jobId: "job-a" })).rejects.toThrow(
        "At least one routing field is required",
      );

      await service.updateJobRouting({ jobId: "job-a", deliveryMode: "none" });
      expect(clawCmd).toHaveBeenLastCalledWith(
        "cron edit 'job-a' --no-deliver",
        expect.objectContaining({ quiet: true }),
      );

      await service.updateJobRouting({
        jobId: "job-a",
        sessionTarget: "MAIN",
        wakeMode: "NOW",
      });
      expect(clawCmd).toHaveBeenLastCalledWith(
        "cron edit 'job-a' --session 'main' --wake 'now'",
        expect.objectContaining({ quiet: true }),
      );

      await service.updateJobRouting({ jobId: "job-a", deliveryChannel: "slack" });
      expect(clawCmd).toHaveBeenLastCalledWith(
        "cron edit 'job-a' --channel 'slack'",
        expect.objectContaining({ quiet: true }),
      );

      await service.updateJobRouting({ jobId: "job-a", deliveryTo: "#general" });
      expect(clawCmd).toHaveBeenLastCalledWith(
        "cron edit 'job-a' --to '#general'",
        expect.objectContaining({ quiet: true }),
      );
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});

describe("server/cron-service run history", () => {
  it("returns empty history when the run log is missing", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const service = makeService(openclawDir);
      const runs = service.getJobRuns({ jobId: "job-a" });
      expect(runs.entries).toEqual([]);
      expect(runs.total).toBe(0);
      expect(runs.hasMore).toBe(false);
      expect(runs.nextOffset).toBeNull();
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("skips malformed and unrelated run log lines", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      "not json at all",
      "null",
      '"a string"',
      "42",
      JSON.stringify({ action: "started", jobId: "job-a", ts: 100 }),
      JSON.stringify({ action: "finished", jobId: "other-job", ts: 100 }),
      JSON.stringify({ action: "finished", jobId: "job-a" }),
      JSON.stringify({ action: "finished", jobId: "job-a", ts: "not-a-number" }),
      JSON.stringify({
        action: "finished",
        jobId: "job-a",
        ts: 100,
        status: "ok",
        delivered: true,
        usage: "not-an-object",
      }),
    ]);
    try {
      const service = makeService(openclawDir);
      const runs = service.getJobRuns({ jobId: "job-a" });
      expect(runs.total).toBe(1);
      expect(runs.entries[0]).toMatchObject({
        ts: 100,
        jobId: "job-a",
        action: "finished",
        status: "ok",
        delivered: true,
      });
      expect(runs.entries[0].usage).toBeUndefined();
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("filters by status, delivery status, and query text", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", {
        ts: 1000,
        status: "ok",
        deliveryStatus: "delivered",
        summary: "sent the digest",
        model: "claude-sonnet-4-5",
        provider: "anthropic",
      }),
      finishedEntry("job-a", {
        ts: 2000,
        status: "error",
        error: "network exploded",
      }),
      finishedEntry("job-a", { ts: 3000, status: "skipped" }),
    ]);
    try {
      const service = makeService(openclawDir);

      const okOnly = service.getJobRuns({ jobId: "job-a", status: "OK" });
      expect(okOnly.total).toBe(1);
      expect(okOnly.entries[0].ts).toBe(1000);

      const errorOnly = service.getJobRuns({ jobId: "job-a", status: "error" });
      expect(errorOnly.total).toBe(1);

      const bogusStatus = service.getJobRuns({ jobId: "job-a", status: "bogus" });
      expect(bogusStatus.total).toBe(3);

      const delivered = service.getJobRuns({ jobId: "job-a", deliveryStatus: "delivered" });
      expect(delivered.total).toBe(1);

      const notRequested = service.getJobRuns({
        jobId: "job-a",
        deliveryStatus: "not-requested",
      });
      expect(notRequested.total).toBe(2);

      const bogusDelivery = service.getJobRuns({
        jobId: "job-a",
        deliveryStatus: "whatever",
      });
      expect(bogusDelivery.total).toBe(3);

      const byQuerySummary = service.getJobRuns({ jobId: "job-a", query: "DIGEST" });
      expect(byQuerySummary.total).toBe(1);
      expect(byQuerySummary.entries[0].ts).toBe(1000);

      const byQueryError = service.getJobRuns({ jobId: "job-a", query: "exploded" });
      expect(byQueryError.total).toBe(1);

      const byQueryModel = service.getJobRuns({ jobId: "job-a", query: "sonnet" });
      expect(byQueryModel.total).toBe(1);

      const byQueryMiss = service.getJobRuns({ jobId: "job-a", query: "nomatch" });
      expect(byQueryMiss.total).toBe(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("sorts and paginates run history", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: 1000 }),
      finishedEntry("job-a", { ts: 3000 }),
      finishedEntry("job-a", { ts: 2000 }),
    ]);
    try {
      const service = makeService(openclawDir);

      const desc = service.getJobRuns({ jobId: "job-a" });
      expect(desc.entries.map((entry) => entry.ts)).toEqual([3000, 2000, 1000]);

      const asc = service.getJobRuns({ jobId: "job-a", sortDir: "asc" });
      expect(asc.entries.map((entry) => entry.ts)).toEqual([1000, 2000, 3000]);

      const firstPage = service.getJobRuns({ jobId: "job-a", limit: 1, offset: 0 });
      expect(firstPage.entries).toHaveLength(1);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextOffset).toBe(1);
      expect(firstPage.total).toBe(3);

      const lastPage = service.getJobRuns({ jobId: "job-a", limit: 2, offset: 2 });
      expect(lastPage.entries).toHaveLength(1);
      expect(lastPage.hasMore).toBe(false);
      expect(lastPage.nextOffset).toBeNull();

      const clamped = service.getJobRuns({ jobId: "job-a", limit: 9999, offset: -5 });
      expect(clamped.limit).toBe(200);
      expect(clamped.offset).toBe(0);

      const defaulted = service.getJobRuns({ jobId: "job-a", limit: "abc", offset: "abc" });
      expect(defaulted.limit).toBe(20);
      expect(defaulted.offset).toBe(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("enriches run entries with estimated costs", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      // 1000: usage already carries estimatedCost.
      finishedEntry("job-a", { ts: 1000, usage: { estimatedCost: 0.25 } }),
      // 2000: snake_case estimated cost.
      finishedEntry("job-a", { ts: 2000, usage: { estimated_cost: 0.5 } }),
      // 3000: derivable from tokens + known model.
      finishedEntry("job-a", {
        ts: 3000,
        model: "claude-sonnet-4-5",
        provider: "anthropic",
        usage: {
          input_tokens: 1_000_000,
          output_tokens: 1000,
          cache_read_tokens: 100,
          cache_write_tokens: 100,
        },
      }),
      // 4000: tokens present but unknown model -> pricingFound false.
      finishedEntry("job-a", {
        ts: 4000,
        model: "totally-unknown-model-xyz",
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
      // 5000: tokens present but no model anywhere -> untouched.
      finishedEntry("job-a", { ts: 5000, usage: { input_tokens: 100 } }),
      // 6000: usage with zero/negative tokens -> untouched.
      finishedEntry("job-a", {
        ts: 6000,
        model: "claude-sonnet-4-5",
        usage: { input_tokens: -5, output_tokens: 0 },
      }),
      // 7000: no usage at all -> untouched.
      finishedEntry("job-a", { ts: 7000 }),
      // 8000: model comes from usage.model.
      finishedEntry("job-a", {
        ts: 8000,
        usage: {
          model: "claude-sonnet-4-5",
          cacheReadTokens: 200,
          cacheWriteTokens: 300,
        },
      }),
    ]);
    try {
      const service = makeService(openclawDir);
      const runs = service.getJobRuns({ jobId: "job-a", sortDir: "asc", limit: 50 });
      const byTs = new Map(runs.entries.map((entry) => [entry.ts, entry]));

      expect(byTs.get(1000).estimatedCost).toBe(0.25);
      expect(byTs.get(1000).usage.estimatedCost).toBe(0.25);
      expect(byTs.get(2000).estimatedCost).toBe(0.5);
      expect(byTs.get(3000).estimatedCost).toBeGreaterThan(0);
      expect(byTs.get(3000).usage.pricingFound).toBe(true);
      expect(byTs.get(4000).estimatedCost).toBeUndefined();
      expect(byTs.get(4000).usage.pricingFound).toBe(false);
      expect(byTs.get(5000).estimatedCost).toBeUndefined();
      expect(byTs.get(5000).usage.pricingFound).toBeUndefined();
      expect(byTs.get(6000).estimatedCost).toBeUndefined();
      expect(byTs.get(7000).estimatedCost).toBeUndefined();
      expect(byTs.get(8000).estimatedCost).toBeGreaterThan(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});

describe("server/cron-service usage", () => {
  it("merges session usage totals with duration stats from the run log", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: 1000, durationMs: 100 }),
      finishedEntry("job-a", { ts: 2000, durationMs: 200 }),
      finishedEntry("job-a", { ts: 3000 }), // no durationMs -> skipped
      finishedEntry("job-a", { ts: 4000, durationMs: "junk" }), // invalid -> skipped
      "not json",
    ]);
    try {
      const getSessionUsageByKeyPattern = vi.fn(() => ({
        totals: { totalTokens: 42, totalCost: 0.1, runCount: 2 },
        modelBreakdown: [],
      }));
      const service = makeService(openclawDir, { getSessionUsageByKeyPattern });
      const usage = service.getJobUsage({ jobId: "job-a" });
      expect(getSessionUsageByKeyPattern).toHaveBeenCalledWith({
        keyPattern: "%:cron:job-a%",
        sinceMs: 0,
      });
      expect(usage.totals).toMatchObject({
        totalTokens: 42,
        totalDurationMs: 300,
        durationSamples: 2,
        avgDurationMs: 150,
      });
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("applies sinceMs filtering to duration stats and tolerates non-object usage", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: 1000, durationMs: 100 }),
      finishedEntry("job-a", { ts: 5000, durationMs: 400 }),
    ]);
    try {
      const service = makeService(openclawDir, {
        getSessionUsageByKeyPattern: vi.fn(() => undefined),
      });
      const usage = service.getJobUsage({ jobId: "job-a", sinceMs: 2000 });
      expect(usage.totals).toMatchObject({
        totalDurationMs: 400,
        durationSamples: 1,
        avgDurationMs: 400,
      });

      const noRunsService = makeService(openclawDir, {
        getSessionUsageByKeyPattern: vi.fn(() => ({ totals: "bad" })),
      });
      const noRuns = noRunsService.getJobUsage({ jobId: "job-missing", sinceMs: "junk" });
      expect(noRuns.totals).toMatchObject({
        totalDurationMs: 0,
        durationSamples: 0,
        avgDurationMs: 0,
      });
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("aggregates bulk usage per job", () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      { id: "job-a", name: "A", state: {} },
      { id: "job-b", name: "B", state: {} },
    ]);
    try {
      const getSessionUsageByKeyPattern = vi.fn(({ keyPattern }) => {
        if (keyPattern.includes("job-a")) {
          return { totals: { totalTokens: 100, totalCost: 0.5, runCount: 4 } };
        }
        return { totals: {} };
      });
      const service = makeService(openclawDir, { getSessionUsageByKeyPattern });
      const bulk = service.getBulkJobUsage({ sinceMs: 123 });
      expect(bulk.sinceMs).toBe(123);
      expect(bulk.byJobId["job-a"]).toEqual({
        totalTokens: 100,
        totalCost: 0.5,
        runCount: 4,
        avgTokensPerRun: 25,
      });
      expect(bulk.byJobId["job-b"]).toEqual({
        totalTokens: 0,
        totalCost: 0,
        runCount: 0,
        avgTokensPerRun: 0,
      });

      const defaulted = service.getBulkJobUsage();
      expect(defaulted.sinceMs).toBe(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("returns bulk runs per job with optional sinceMs filtering", () => {
    const openclawDir = createOpenclawDirWithCronJobs([
      { id: "job-a", name: "A", state: {} },
      { id: "job-b", name: "B", state: {} },
    ]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: 1000 }),
      finishedEntry("job-a", { ts: 5000 }),
    ]);
    try {
      const service = makeService(openclawDir);
      const all = service.getBulkJobRuns();
      expect(all.sinceMs).toBe(0);
      expect(all.byJobId["job-a"].total).toBe(2);
      expect(all.byJobId["job-b"].total).toBe(0);

      const filtered = service.getBulkJobRuns({
        sinceMs: 2000,
        limitPerJob: "junk",
        status: "ok",
        deliveryStatus: "all",
        sortDir: "asc",
        query: "",
      });
      expect(filtered.byJobId["job-a"].total).toBe(1);
      expect(filtered.byJobId["job-a"].entries[0].ts).toBe(5000);

      const clamped = service.getBulkJobRuns({ limitPerJob: 100000 });
      expect(clamped.byJobId["job-a"].total).toBe(2);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});

describe("server/cron-service trends", () => {
  const sumPoints = (points, key) =>
    points.reduce((sum, point) => sum + point[key], 0);

  it("builds daily buckets for the default 7d range", () => {
    const nowMs = Date.now();
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", {
        ts: nowMs - 1000,
        status: "ok",
        durationMs: 1000,
        usage: { input_tokens: 100, output_tokens: 50, estimatedCost: 0.2 },
      }),
      finishedEntry("job-a", { ts: nowMs - 2000, status: "error" }),
      finishedEntry("job-a", { ts: nowMs - 3000, status: "skipped" }),
      finishedEntry("job-a", { ts: nowMs - 4000, status: "weird-status" }),
      // Outside the 7d window.
      finishedEntry("job-a", { ts: nowMs - 40 * 24 * 60 * 60 * 1000 }),
      // In the future -> beyond windowEndMs.
      finishedEntry("job-a", { ts: nowMs + 60 * 60 * 1000 }),
      "garbage line",
    ]);
    try {
      const service = makeService(openclawDir);
      const trends = service.getJobRunTrends({ jobId: "job-a" });
      expect(trends.range).toBe("7d");
      expect(trends.bucket).toBe("day");
      expect(trends.points).toHaveLength(7);
      expect(sumPoints(trends.points, "totalRuns")).toBe(4);
      expect(sumPoints(trends.points, "ok")).toBe(1);
      expect(sumPoints(trends.points, "error")).toBe(1);
      expect(sumPoints(trends.points, "skipped")).toBe(1);
      expect(sumPoints(trends.points, "totalTokens")).toBe(150);
      expect(sumPoints(trends.points, "costSamples")).toBe(1);
      expect(sumPoints(trends.points, "totalCost")).toBeCloseTo(0.2);
      expect(sumPoints(trends.points, "durationSamples")).toBe(1);
      const withDuration = trends.points.find((point) => point.durationSamples > 0);
      expect(withDuration.avgDurationMs).toBe(1000);
      const withoutDuration = trends.points.find((point) => point.durationSamples === 0);
      expect(withoutDuration.avgDurationMs).toBe(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("builds hourly buckets for the 24h range", () => {
    const nowMs = Date.now();
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: nowMs - 30 * 60 * 1000, status: "ok" }),
      finishedEntry("job-a", { ts: nowMs - 30 * 60 * 60 * 1000, status: "ok" }),
    ]);
    try {
      const service = makeService(openclawDir);
      const trends = service.getJobRunTrends({ jobId: "job-a", range: "24H" });
      expect(trends.range).toBe("24h");
      expect(trends.bucket).toBe("hour");
      expect(trends.points).toHaveLength(24);
      expect(sumPoints(trends.points, "totalRuns")).toBe(1);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("supports the 30d range and falls back to 7d for unknown ranges", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: Date.now() - 1000, status: "ok" }),
    ]);
    try {
      const service = makeService(openclawDir);
      const monthly = service.getJobRunTrends({ jobId: "job-a", range: "30d" });
      expect(monthly.range).toBe("30d");
      expect(monthly.points).toHaveLength(30);
      expect(sumPoints(monthly.points, "totalRuns")).toBe(1);

      const fallback = service.getJobRunTrends({ jobId: "job-a", range: "banana" });
      expect(fallback.range).toBe("7d");
      expect(fallback.points).toHaveLength(7);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("anchors the window at sinceMs and skips entries beyond bucket coverage", () => {
    const nowMs = Date.now();
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      finishedEntry("job-a", { ts: nowMs - 1000, status: "ok" }),
    ]);
    try {
      const service = makeService(openclawDir);

      // Day-aligned sinceMs far in the past: today's entry is inside the window
      // but beyond the 7 generated day-buckets, exercising the bucket-miss path.
      const stale = service.getJobRunTrends({
        jobId: "job-a",
        sinceMs: nowMs - 100 * 24 * 60 * 60 * 1000,
        range: "7d",
      });
      expect(sumPoints(stale.points, "totalRuns")).toBe(0);

      // Non-aligned sinceMs for the hourly range starts exactly at sinceMs.
      const sinceMs = nowMs - 2 * 60 * 60 * 1000;
      const hourly = service.getJobRunTrends({ jobId: "job-a", sinceMs, range: "24h" });
      expect(hourly.sinceMs).toBe(sinceMs);
      expect(sumPoints(hourly.points, "totalRuns")).toBe(1);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("computes trend token totals from fallback fields", () => {
    const nowMs = Date.now();
    const openclawDir = createOpenclawDirWithCronJobs([]);
    writeRunLog(openclawDir, "job-a", [
      // Component tokens with camelCase keys and ignored negatives.
      finishedEntry("job-a", {
        ts: nowMs - 1000,
        status: "ok",
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          cacheReadTokens: 30,
          cacheWriteTokens: 40,
          input_tokens: -1,
        },
      }),
      // Component total is zero -> falls back to usage.total_tokens.
      finishedEntry("job-a", {
        ts: nowMs - 2000,
        status: "ok",
        usage: { total_tokens: 500, totalCost: 0.75 },
      }),
      // No usage tokens anywhere -> zero, cost from usage.cost.
      finishedEntry("job-a", {
        ts: nowMs - 3000,
        status: "ok",
        usage: { cost: 0.05 },
      }),
    ]);
    try {
      const service = makeService(openclawDir);
      const trends = service.getJobRunTrends({ jobId: "job-a", range: "7d" });
      expect(sumPoints(trends.points, "totalTokens")).toBe(600);
      expect(sumPoints(trends.points, "totalCost")).toBeCloseTo(0.8);
      expect(sumPoints(trends.points, "costSamples")).toBe(2);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });

  it("returns empty trend buckets when the run log is missing", () => {
    const openclawDir = createOpenclawDirWithCronJobs([]);
    try {
      const service = makeService(openclawDir);
      const trends = service.getJobRunTrends({ jobId: "job-a", range: "7d" });
      expect(trends.points).toHaveLength(7);
      expect(sumPoints(trends.points, "totalRuns")).toBe(0);
    } finally {
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
  });
});
