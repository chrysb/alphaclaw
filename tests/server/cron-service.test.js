const { createCronService } = require("../../lib/server/cron-service");

describe("server/cron-service", () => {
  it("uses plain cron commands without --json for run/toggle/edit", async () => {
    const clawCmd = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, stdout: "ran job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "disabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "enabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "updated prompt" })
      .mockResolvedValueOnce({ ok: true, stdout: "updated routing" });
    const cronService = createCronService({
      clawCmd,
      OPENCLAW_DIR: "/tmp/openclaw",
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
  });
});
