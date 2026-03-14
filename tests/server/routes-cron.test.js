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
});
