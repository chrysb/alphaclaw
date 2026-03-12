const { createCronService } = require("../../lib/server/cron-service");

describe("server/cron-service", () => {
  it("uses plain cron toggle commands without --json", async () => {
    const clawCmd = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, stdout: "disabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "enabled job-a" })
      .mockResolvedValueOnce({ ok: true, stdout: "updated prompt" });
    const cronService = createCronService({
      clawCmd,
      OPENCLAW_DIR: "/tmp/openclaw",
      getSessionUsageByKeyPattern: vi.fn(() => ({})),
    });

    const result = await cronService.setJobEnabled({
      jobId: "job-a",
      enabled: false,
    });

    expect(clawCmd).toHaveBeenCalledTimes(1);
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "cron disable 'job-a'",
      expect.objectContaining({ quiet: true }),
    );
    expect(result.raw).toBe("disabled job-a");
    expect(result.parsed).toBeNull();

    const secondResult = await cronService.setJobEnabled({
      jobId: "job-a",
      enabled: true,
    });
    expect(clawCmd).toHaveBeenCalledTimes(2);
    expect(clawCmd).toHaveBeenNthCalledWith(
      2,
      "cron enable 'job-a'",
      expect.objectContaining({ quiet: true }),
    );
    expect(secondResult.raw).toBe("enabled job-a");

    const promptResult = await cronService.updateJobPrompt({
      jobId: "job-a",
      message: "hello world",
    });
    expect(clawCmd).toHaveBeenCalledTimes(3);
    expect(clawCmd).toHaveBeenNthCalledWith(
      3,
      "cron edit 'job-a' --message 'hello world'",
      expect.objectContaining({ quiet: true }),
    );
    expect(promptResult.raw).toBe("updated prompt");
  });
});
