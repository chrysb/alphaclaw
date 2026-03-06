const express = require("express");
const request = require("supertest");

const { registerDoctorRoutes } = require("../../lib/server/routes/doctor");

const createDoctorService = () => ({
  buildStatus: vi.fn(() => ({
    runInProgress: false,
    stale: true,
    needsInitialRun: true,
    latestRun: null,
  })),
  runDoctor: vi.fn(() => ({ ok: true, runId: 42, status: { runInProgress: true } })),
  importDoctorResult: vi.fn(({ rawOutput }) => ({
    ok: true,
    runId: 43,
    run: { id: 43, summary: rawOutput ? "Imported" : "" },
  })),
  listDoctorRuns: vi.fn(() => [{ id: 42, status: "running", cardCount: 0 }]),
  listDoctorCards: vi.fn(({ runId }) =>
    String(runId || "all") === "all"
      ? [
          { id: 7, runId: 42, title: "Fix drift", status: "open" },
          { id: 8, runId: 41, title: "Cleanup docs", status: "dismissed" },
        ]
      : [{ id: 7, runId: 42, title: "Fix drift", status: "open" }]),
  getDoctorRun: vi.fn((id) =>
    String(id) === "42"
      ? { id: 42, status: "completed", cardCount: 1 }
      : null),
  getDoctorCardsByRunId: vi.fn((id) =>
    String(id) === "42"
      ? [{ id: 7, runId: 42, title: "Fix drift", status: "open" }]
      : []),
  setCardStatus: vi.fn(({ cardId, status }) => ({
    id: Number(cardId),
    status,
  })),
  requestCardFix: vi.fn(async ({ cardId, sessionId, replyChannel, replyTo }) => ({
    ok: true,
    stdout: "sent",
    card: { id: Number(cardId), sessionId, replyChannel, replyTo },
  })),
});

const createApp = (doctorService) => {
  const app = express();
  app.use(express.json());
  registerDoctorRoutes({
    app,
    requireAuth: (req, res, next) => next(),
    doctorService,
  });
  return app;
};

describe("server/routes/doctor", () => {
  it("returns Doctor status", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).get("/api/doctor/status");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(doctorService.buildStatus).toHaveBeenCalledTimes(1);
  });

  it("starts a Doctor run", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/run").send({});

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      ok: true,
      runId: 42,
      status: { runInProgress: true },
    });
  });

  it("returns 200 when a Doctor run reuses previous findings", async () => {
    const doctorService = createDoctorService();
    doctorService.runDoctor.mockReturnValue({
      ok: true,
      runId: 44,
      reusedPreviousRun: true,
      sourceRunId: 42,
      status: { runInProgress: false },
    });
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/run").send({});

    expect(res.status).toBe(200);
    expect(res.body.reusedPreviousRun).toBe(true);
    expect(res.body.sourceRunId).toBe(42);
  });

  it("returns 409 when a Doctor run is already in progress", async () => {
    const doctorService = createDoctorService();
    doctorService.runDoctor.mockReturnValue({
      ok: false,
      alreadyRunning: true,
      runId: 42,
      status: { runInProgress: true },
      error: "Doctor run already in progress",
    });
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/run").send({});

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Doctor run already in progress");
  });

  it("imports a Doctor result without rerunning analysis", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/import").send({
      rawOutput: '{"summary":"Imported","cards":[]}',
    });

    expect(res.status).toBe(201);
    expect(doctorService.importDoctorResult).toHaveBeenCalledWith({
      rawOutput: '{"summary":"Imported","cards":[]}',
    });
    expect(res.body.runId).toBe(43);
  });

  it("returns run cards for an existing run", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).get("/api/doctor/runs/42/cards");

    expect(res.status).toBe(200);
    expect(res.body.cards).toEqual([
      { id: 7, runId: 42, title: "Fix drift", status: "open" },
    ]);
  });

  it("returns aggregated Doctor cards with optional run filter", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const allCardsResponse = await request(app).get("/api/doctor/cards");
    const runCardsResponse = await request(app).get("/api/doctor/cards?runId=42");

    expect(allCardsResponse.status).toBe(200);
    expect(allCardsResponse.body.cards).toHaveLength(2);
    expect(doctorService.listDoctorCards).toHaveBeenNthCalledWith(1, { runId: "all" });
    expect(runCardsResponse.status).toBe(200);
    expect(doctorService.listDoctorCards).toHaveBeenNthCalledWith(2, { runId: "42" });
  });

  it("updates Doctor card status", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/cards/7/status").send({
      status: "fixed",
    });

    expect(res.status).toBe(200);
    expect(res.body.card).toEqual({ id: 7, status: "fixed" });
  });

  it("sends a Doctor fix request with delivery fields", async () => {
    const doctorService = createDoctorService();
    const app = createApp(doctorService);

    const res = await request(app).post("/api/doctor/findings/7/fix").send({
      sessionId: "session-123",
      replyChannel: "telegram",
      replyTo: "1050",
      prompt: "Use the safer prompt",
    });

    expect(res.status).toBe(200);
    expect(doctorService.requestCardFix).toHaveBeenCalledWith({
      cardId: "7",
      sessionId: "session-123",
      replyChannel: "telegram",
      replyTo: "1050",
      prompt: "Use the safer prompt",
    });
    expect(res.body.ok).toBe(true);
  });
});
