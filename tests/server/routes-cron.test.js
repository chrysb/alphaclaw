const express = require("express");
const request = require("supertest");

const { registerCronRoutes } = require("../../lib/server/routes/cron");

const createDeps = () => ({
  requireAuth: (req, res, next) => next(),
  cronService: {
    listJobs: vi.fn(() => ({
      storePath: "/tmp/openclaw/cron/jobs.json",
      jobs: [{ id: "job-a", name: "Job A", enabled: true, state: {} }],
    })),
    getStatus: vi.fn(() => ({
      enabled: true,
      jobs: 1,
      enabledJobs: 1,
      nextWakeAtMs: 1773291600000,
    })),
    getJobRuns: vi.fn(() => ({
      entries: [{ ts: 1773291600000, status: "ok", jobId: "job-a", action: "finished" }],
      total: 1,
      offset: 0,
      limit: 20,
      hasMore: false,
      nextOffset: null,
    })),
    runJobNow: vi.fn(async () => ({ parsed: { ok: true, ran: true } })),
    setJobEnabled: vi.fn(async () => ({ parsed: { ok: true } })),
    updateJobPrompt: vi.fn(async () => ({ parsed: { ok: true } })),
    updateJobRouting: vi.fn(async () => ({ parsed: { ok: true } })),
    getJobUsage: vi.fn(() => ({
      totals: { totalTokens: 1000, totalCost: 0.01, runCount: 2 },
      modelBreakdown: [],
    })),
    getJobRunTrends: vi.fn(() => ({
      sinceMs: 0,
      nowMs: 1773291600000,
      bucket: "day",
      points: [
        {
          startMs: 1773205200000,
          endMs: 1773291600000,
          ok: 1,
          error: 0,
          skipped: 0,
          totalRuns: 1,
          totalTokens: 500,
          totalCost: 0.005,
          costSamples: 1,
          totalDurationMs: 5000,
          durationSamples: 1,
          avgDurationMs: 5000,
        },
      ],
    })),
    getBulkJobUsage: vi.fn(() => ({
      sinceMs: 0,
      byJobId: {
        "job-a": {
          totalTokens: 1000,
          totalCost: 0.01,
          runCount: 2,
          avgTokensPerRun: 500,
        },
      },
    })),
    getBulkJobRuns: vi.fn(() => ({
      sinceMs: 0,
      byJobId: {
        "job-a": {
          entries: [{ ts: 1773291600000, status: "ok", jobId: "job-a" }],
          total: 1,
        },
      },
    })),
  },
});

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerCronRoutes({
    app,
    ...deps,
  });
  return app;
};

describe("server/routes/cron", () => {
  it("returns job list", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const response = await request(app).get("/api/cron/jobs");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.jobs).toHaveLength(1);
    expect(deps.cronService.listJobs).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "nextRunAtMs", sortDir: "asc" }),
    );
  });

  it("returns run history page", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const response = await request(app).get("/api/cron/jobs/job-a/runs?limit=20&offset=0");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.runs.total).toBe(1);
    expect(deps.cronService.getJobRuns).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-a", limit: 20, offset: 0 }),
    );
  });

  it("triggers run and prompt updates", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const runResponse = await request(app).post("/api/cron/jobs/job-a/run");
    expect(runResponse.status).toBe(200);
    expect(deps.cronService.runJobNow).toHaveBeenCalledWith("job-a");

    const promptResponse = await request(app)
      .put("/api/cron/jobs/job-a/prompt")
      .send({ message: "new prompt" });
    expect(promptResponse.status).toBe(200);
    expect(deps.cronService.updateJobPrompt).toHaveBeenCalledWith({
      jobId: "job-a",
      message: "new prompt",
    });

    const routingResponse = await request(app)
      .put("/api/cron/jobs/job-a/routing")
      .send({ sessionTarget: "isolated", wakeMode: "next-heartbeat", deliveryMode: "announce" });
    expect(routingResponse.status).toBe(200);
    expect(deps.cronService.updateJobRouting).toHaveBeenCalledWith({
      jobId: "job-a",
      sessionTarget: "isolated",
      wakeMode: "next-heartbeat",
      deliveryMode: "announce",
      deliveryChannel: "",
      deliveryTo: "",
    });
  });

  it("returns usage and toggles enabled state", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const usageResponse = await request(app).get("/api/cron/jobs/job-a/usage?days=7");
    expect(usageResponse.status).toBe(200);
    expect(deps.cronService.getJobUsage).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-a" }),
    );
    const trendsResponse = await request(app).get("/api/cron/jobs/job-a/trends?range=7d");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.ok).toBe(true);
    expect(Array.isArray(trendsResponse.body.trends.points)).toBe(true);
    expect(deps.cronService.getJobRunTrends).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-a", range: "7d" }),
    );

    const enableResponse = await request(app).post("/api/cron/jobs/job-a/enable");
    expect(enableResponse.status).toBe(200);
    expect(deps.cronService.setJobEnabled).toHaveBeenCalledWith({
      jobId: "job-a",
      enabled: true,
    });
  });

  it("returns bulk usage and bulk runs", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const bulkUsageResponse = await request(app).get("/api/cron/usage/bulk?days=30");
    expect(bulkUsageResponse.status).toBe(200);
    expect(bulkUsageResponse.body.ok).toBe(true);
    expect(bulkUsageResponse.body.usage.byJobId["job-a"].avgTokensPerRun).toBe(500);
    expect(deps.cronService.getBulkJobUsage).toHaveBeenCalledWith(
      expect.objectContaining({ sinceMs: expect.any(Number) }),
    );

    const bulkRunsResponse = await request(app).get(
      "/api/cron/runs/bulk?sinceMs=12345&limitPerJob=40&sortDir=desc",
    );
    expect(bulkRunsResponse.status).toBe(200);
    expect(bulkRunsResponse.body.ok).toBe(true);
    expect(bulkRunsResponse.body.runs.byJobId["job-a"].entries).toHaveLength(1);
    expect(deps.cronService.getBulkJobRuns).toHaveBeenCalledWith(
      expect.objectContaining({ sinceMs: 12345, limitPerJob: 40, sortDir: "desc" }),
    );
  });

  it("returns cron status", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const response = await request(app).get("/api/cron/status");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.status.jobs).toBe(1);
    expect(deps.cronService.getStatus).toHaveBeenCalled();
  });

  it("disables jobs", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const response = await request(app).post("/api/cron/jobs/job-a/disable");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(deps.cronService.setJobEnabled).toHaveBeenCalledWith({
      jobId: "job-a",
      enabled: false,
    });
  });

  it("passes run history filters through to the service", async () => {
    const deps = createDeps();
    const app = createApp(deps);
    const response = await request(app).get(
      "/api/cron/jobs/job-a/runs?limit=5&offset=10&status=error&deliveryStatus=delivered&sortDir=asc&query=digest",
    );
    expect(response.status).toBe(200);
    expect(deps.cronService.getJobRuns).toHaveBeenCalledWith({
      jobId: "job-a",
      limit: 5,
      offset: 10,
      status: "error",
      deliveryStatus: "delivered",
      sortDir: "asc",
      query: "digest",
    });
  });

  it("defaults usage and bulk windows to zero when days is absent", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const usageResponse = await request(app).get("/api/cron/jobs/job-a/usage");
    expect(usageResponse.status).toBe(200);
    expect(deps.cronService.getJobUsage).toHaveBeenCalledWith({
      jobId: "job-a",
      sinceMs: 0,
    });

    const bulkUsageResponse = await request(app).get("/api/cron/usage/bulk");
    expect(bulkUsageResponse.status).toBe(200);
    expect(deps.cronService.getBulkJobUsage).toHaveBeenCalledWith({ sinceMs: 0 });

    const bulkRunsResponse = await request(app).get("/api/cron/runs/bulk");
    expect(bulkRunsResponse.status).toBe(200);
    expect(deps.cronService.getBulkJobRuns).toHaveBeenCalledWith({
      sinceMs: 0,
      limitPerJob: 20,
      status: "all",
      deliveryStatus: "all",
      sortDir: "desc",
    });
  });

  it("falls back to raw output then empty object for command results", async () => {
    const deps = createDeps();
    deps.cronService.runJobNow = vi.fn(async () => ({ parsed: null, raw: "plain text" }));
    deps.cronService.setJobEnabled = vi.fn(async () => ({ parsed: null, raw: "" }));
    const app = createApp(deps);

    const rawResponse = await request(app).post("/api/cron/jobs/job-a/run");
    expect(rawResponse.status).toBe(200);
    expect(rawResponse.body.result).toBe("plain text");

    const emptyResponse = await request(app).post("/api/cron/jobs/job-a/enable");
    expect(emptyResponse.status).toBe(200);
    expect(emptyResponse.body.result).toEqual({});
  });

  it("maps service failures to error responses on every route", async () => {
    const deps = createDeps();
    const boom = () => {
      throw new Error("service exploded");
    };
    const asyncBoom = async () => {
      throw new Error("service exploded");
    };
    deps.cronService.listJobs = vi.fn(boom);
    deps.cronService.getStatus = vi.fn(boom);
    deps.cronService.getJobRuns = vi.fn(boom);
    deps.cronService.runJobNow = vi.fn(asyncBoom);
    deps.cronService.setJobEnabled = vi.fn(asyncBoom);
    deps.cronService.updateJobPrompt = vi.fn(asyncBoom);
    deps.cronService.updateJobRouting = vi.fn(asyncBoom);
    deps.cronService.getJobUsage = vi.fn(boom);
    deps.cronService.getJobRunTrends = vi.fn(boom);
    deps.cronService.getBulkJobUsage = vi.fn(boom);
    deps.cronService.getBulkJobRuns = vi.fn(boom);
    const app = createApp(deps);

    const expectations = [
      { method: "get", url: "/api/cron/jobs", status: 500 },
      { method: "get", url: "/api/cron/status", status: 500 },
      { method: "get", url: "/api/cron/jobs/job-a/runs", status: 400 },
      { method: "post", url: "/api/cron/jobs/job-a/run", status: 400 },
      { method: "post", url: "/api/cron/jobs/job-a/enable", status: 400 },
      { method: "post", url: "/api/cron/jobs/job-a/disable", status: 400 },
      { method: "put", url: "/api/cron/jobs/job-a/prompt", status: 400 },
      { method: "put", url: "/api/cron/jobs/job-a/routing", status: 400 },
      { method: "get", url: "/api/cron/jobs/job-a/usage?days=7", status: 400 },
      { method: "get", url: "/api/cron/jobs/job-a/trends", status: 400 },
      { method: "get", url: "/api/cron/usage/bulk?days=7", status: 400 },
      { method: "get", url: "/api/cron/runs/bulk", status: 400 },
    ];
    for (const { method, url, status } of expectations) {
      const response = await request(app)[method](url);
      expect(response.status).toBe(status);
      expect(response.body).toEqual({ ok: false, error: "service exploded" });
    }
  });

  it("handles prompt and routing requests with missing bodies", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const promptResponse = await request(app).put("/api/cron/jobs/job-a/prompt");
    expect(promptResponse.status).toBe(200);
    expect(deps.cronService.updateJobPrompt).toHaveBeenCalledWith({
      jobId: "job-a",
      message: "",
    });

    const routingResponse = await request(app).put("/api/cron/jobs/job-a/routing");
    expect(routingResponse.status).toBe(200);
    expect(deps.cronService.updateJobRouting).toHaveBeenCalledWith({
      jobId: "job-a",
      sessionTarget: "",
      wakeMode: "",
      deliveryMode: "",
      deliveryChannel: "",
      deliveryTo: "",
    });
  });
});
